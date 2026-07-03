package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.CreateRecurringTemplateRequest;
import com.cuentasclaras.back.dto.RecurringTemplateDto;
import com.cuentasclaras.back.dto.UpdateRecurringMontoRequest;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class RecurringExpenseService {

    private static final Logger log = LoggerFactory.getLogger(RecurringExpenseService.class);

    private final RecurringExpenseTemplateRepository templateRepository;
    private final ConsortiumRepository               consortiumRepository;
    private final ConsortiumMemberRepository         memberRepository;
    private final ExpenseRepository                  expenseRepository;
    private final UserRepository                     userRepository;
    private final PeriodService                      periodService;

    public RecurringExpenseService(RecurringExpenseTemplateRepository templateRepository,
                                   ConsortiumRepository consortiumRepository,
                                   ConsortiumMemberRepository memberRepository,
                                   ExpenseRepository expenseRepository,
                                   UserRepository userRepository,
                                   PeriodService periodService) {
        this.templateRepository  = templateRepository;
        this.consortiumRepository = consortiumRepository;
        this.memberRepository    = memberRepository;
        this.expenseRepository   = expenseRepository;
        this.userRepository      = userRepository;
        this.periodService       = periodService;
    }

    // ── Scheduler mensual ─────────────────────────────────────────────────────

    @Scheduled(cron = "0 10 0 1 * *")
    @Transactional
    public void generarGastosRecurrentes() {
        int mes = LocalDate.now().getMonthValue();
        int anio = LocalDate.now().getYear();
        log.info("[RecurringExpenseService] Generando gastos recurrentes para {}/{}...", mes, anio);

        List<RecurringExpenseTemplate> activas = templateRepository.findAllByActivoTrue();
        int generados = 0;

        for (RecurringExpenseTemplate t : activas) {
            if (t.getLastGeneratedYear() != null
                    && t.getLastGeneratedYear() == anio
                    && t.getLastGeneratedMonth() != null
                    && t.getLastGeneratedMonth() == mes) {
                continue;
            }
            aplicarPlantilla(t, LocalDate.now());
            t.setLastGeneratedYear(anio);
            t.setLastGeneratedMonth(mes);
            templateRepository.save(t);
            generados++;
        }
        log.info("[RecurringExpenseService] Gastos generados: {}", generados);
    }

    // ── CRUD de plantillas ────────────────────────────────────────────────────

    @Transactional
    public RecurringTemplateDto createTemplate(CreateRecurringTemplateRequest req,
                                               String callerEmail) {
        Long consortiumId = parseId(req.grupoId());
        assertAdmin(consortiumId, callerEmail);

        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));

        RecurringExpenseTemplate t = new RecurringExpenseTemplate(
                consortium, req.descripcion(), req.monto(),
                req.categoria(), callerEmail
        );
        templateRepository.save(t);
        return toDto(t);
    }

    public List<RecurringTemplateDto> getTemplates(Long consortiumId, String callerEmail) {
        assertAdmin(consortiumId, callerEmail);
        return templateRepository
                .findByConsortiumIdOrderByCreatedAtDesc(consortiumId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public RecurringTemplateDto updateMonto(Long templateId, UpdateRecurringMontoRequest req,
                                            String callerEmail) {
        RecurringExpenseTemplate t = getAndAssertAdmin(templateId, callerEmail);
        t.setMonto(req.monto());
        templateRepository.save(t);
        return toDto(t);
    }

    @Transactional
    public RecurringTemplateDto toggleActivo(Long templateId, String callerEmail) {
        RecurringExpenseTemplate t = getAndAssertAdmin(templateId, callerEmail);
        t.setActivo(!t.isActivo());
        templateRepository.save(t);
        return toDto(t);
    }

    @Transactional
    public RecurringTemplateDto applyManually(Long templateId, String callerEmail) {
        RecurringExpenseTemplate t = getAndAssertAdmin(templateId, callerEmail);
        if (!t.isActivo()) {
            throw new IllegalArgumentException("La plantilla está inactiva");
        }
        aplicarPlantilla(t, LocalDate.now());
        int mes  = LocalDate.now().getMonthValue();
        int anio = LocalDate.now().getYear();
        t.setLastGeneratedYear(anio);
        t.setLastGeneratedMonth(mes);
        templateRepository.save(t);
        return toDto(t);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private void aplicarPlantilla(RecurringExpenseTemplate t, LocalDate fecha) {
        Long consortiumId = t.getConsortium().getId();
        List<ConsortiumMember> members = memberRepository.findByConsortiumId(consortiumId);
        if (members.isEmpty()) return;

        BigDecimal totalMetrosCuadrados = members.stream()
                .map(ConsortiumMember::getMetrosCuadrados)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (ConsortiumMember m : members) {
            BigDecimal cuota = t.getMonto()
                    .multiply(m.getMetrosCuadrados())
                    .divide(totalMetrosCuadrados, 2, RoundingMode.HALF_UP);
            m.setBalance(m.getBalance().subtract(cuota));
            memberRepository.save(m);
        }

        Period period = periodService.getCurrentPeriod(consortiumId);

        Expense expense = new Expense(
                t.getConsortium(),
                t.getDescripcion(),
                t.getMonto(),
                t.getCategoria(),
                fecha,
                t.getCargadoPorEmail(),
                ExpenseType.FIJO,
                null
        );
        expense.setPeriod(period);
        expenseRepository.save(expense);

        log.info("[RecurringExpenseService] Plantilla '{}' aplicada al consorcio {}",
                t.getDescripcion(), consortiumId);
    }

    private RecurringExpenseTemplate getAndAssertAdmin(Long templateId, String callerEmail) {
        RecurringExpenseTemplate t = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Plantilla no encontrada"));
        assertAdmin(t.getConsortium().getId(), callerEmail);
        return t;
    }

    private void assertAdmin(Long consortiumId, String callerEmail) {
        User user = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        boolean isAdmin = memberRepository.existsByConsortiumIdAndUserIdAndRole(
                consortiumId, user.getId(), ConsortiumRole.ADMIN);
        if (!isAdmin) throw new ForbiddenException("Solo el administrador puede gestionar plantillas");
    }

    private Long parseId(String id) {
        try { return Long.parseLong(id); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("ID inválido: " + id); }
    }

    private RecurringTemplateDto toDto(RecurringExpenseTemplate t) {
        return new RecurringTemplateDto(
                t.getId(),
                t.getConsortium().getId(),
                t.getDescripcion(),
                t.getMonto(),
                t.getCategoria(),
                t.getCargadoPorEmail(),
                t.isActivo(),
                t.getLastGeneratedYear(),
                t.getLastGeneratedMonth(),
                t.getCreatedAt().toString()
        );
    }
}
