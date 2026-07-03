package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.ExpenseDetailDTO;
import com.cuentasclaras.back.dto.PeriodDto;
import com.cuentasclaras.back.dto.PeriodMemberSnapshotDto;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PeriodService {

    private static final Logger log = LoggerFactory.getLogger(PeriodService.class);

    private final PeriodRepository               periodRepository;
    private final PeriodMemberSnapshotRepository snapshotRepository;
    private final ConsortiumRepository           consortiumRepository;
    private final ConsortiumMemberRepository     memberRepository;
    private final UserRepository                 userRepository;
    private final FundMovementRepository         fundMovementRepository;
    private final ExpenseRepository              expenseRepository;
    private final PaymentRepository              paymentRepository;

    public PeriodService(PeriodRepository periodRepository,
                         PeriodMemberSnapshotRepository snapshotRepository,
                         ConsortiumRepository consortiumRepository,
                         ConsortiumMemberRepository memberRepository,
                         UserRepository userRepository,
                         FundMovementRepository fundMovementRepository,
                         ExpenseRepository expenseRepository,
                         PaymentRepository paymentRepository) {
        this.periodRepository      = periodRepository;
        this.snapshotRepository    = snapshotRepository;
        this.consortiumRepository  = consortiumRepository;
        this.memberRepository      = memberRepository;
        this.userRepository        = userRepository;
        this.fundMovementRepository = fundMovementRepository;
        this.expenseRepository     = expenseRepository;
        this.paymentRepository     = paymentRepository;
    }

    // ── Consulta pública (usada por FinanceService) ───────────────────────────

    /**
     * Devuelve el período abierto del consorcio.
     * Si no existe ninguno, crea el primero y asigna todos los registros huérfanos.
     */
    @Transactional
    public Period getCurrentPeriod(Long consortiumId) {
        return periodRepository
                .findByConsortiumIdAndEstado(consortiumId, PeriodStatus.ABIERTO)
                .orElseGet(() -> createFirstPeriod(consortiumId));
    }

    // ── API pública ───────────────────────────────────────────────────────────

    public PeriodDto getCurrentPeriodDto(Long consortiumId) {
        Period p = getCurrentPeriod(consortiumId);
        return toDto(p);
    }

    public List<PeriodDto> getHistorial(Long consortiumId) {
        return periodRepository
                .findByConsortiumIdOrderByFechaAperturaDesc(consortiumId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public PeriodDto getPeriodDetailById(Long periodId) {
        Period p = periodRepository.findById(periodId)
                .orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        return toDto(p);
    }

    public PeriodDto getPeriodDetail(Long consortiumId, Long periodId) {
        Period p = periodRepository.findById(periodId)
                .orElseThrow(() -> new IllegalArgumentException("Período no encontrado"));
        if (!p.getConsortium().getId().equals(consortiumId)) {
            throw new ForbiddenException("El período no pertenece a este consorcio");
        }
        return toDto(p);
    }

    @Scheduled(cron = "0 15 0 * * *")
    public void cerrarPeriodosAutomaticos() {
        int hoy = LocalDate.now().getDayOfMonth();
        List<Consortium> consorcios = consortiumRepository.findAllByDiaCierre(hoy);
        for (Consortium c : consorcios) {
            try {
                closePeriodInternal(c.getId());
                log.info("[PeriodService] Cierre automático ejecutado para consorcio {}", c.getId());
            } catch (Exception e) {
                log.error("[PeriodService] Error en cierre automático del consorcio {}: {}", c.getId(), e.getMessage());
            }
        }
    }

    @Transactional
    public PeriodDto closePeriod(Long consortiumId, String callerEmail) {
        assertAdmin(consortiumId, callerEmail);
        return closePeriodInternal(consortiumId);
    }

    @Transactional
    public PeriodDto closePeriodInternal(Long consortiumId) {
        Period actual = getCurrentPeriod(consortiumId);

        // Snapshot de balances de todos los miembros al cierre
        List<ConsortiumMember> members = memberRepository.findByConsortiumId(consortiumId);
        for (ConsortiumMember m : members) {
            snapshotRepository.save(new PeriodMemberSnapshot(
                    actual,
                    m.getUser().getId(),
                    m.getUser().getNombre(),
                    m.getBalance()
            ));
        }

        // Snapshot del fondo
        BigDecimal saldoFondo = fundMovementRepository.calcularSaldo(consortiumId);
        actual.setSaldoFinalFondo(saldoFondo);
        actual.setFechaCierre(LocalDate.now());
        actual.setEstado(PeriodStatus.CERRADO);
        periodRepository.save(actual);

        // Abrir nuevo período con el saldo del fondo como saldo inicial
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));
        LocalDate hoy = LocalDate.now();
        Period nuevo = new Period(consortium, hoy.getMonthValue(), hoy.getYear(), saldoFondo);
        periodRepository.save(nuevo);

        log.info("[PeriodService] Período {}/{} cerrado para consorcio {}. Nuevo período abierto.",
                actual.getMes(), actual.getAnio(), consortiumId);

        return toDto(actual);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private Period createFirstPeriod(Long consortiumId) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado: " + consortiumId));

        LocalDate hoy = LocalDate.now();
        BigDecimal saldoFondo = fundMovementRepository.calcularSaldo(consortiumId);
        Period primer = new Period(consortium, hoy.getMonthValue(), hoy.getYear(), saldoFondo);
        periodRepository.save(primer);

        // Asignar todos los expenses y pagos huérfanos a este primer período
        int expensesAsignados = expenseRepository.assignOrphansToPeriod(consortiumId, primer.getId());
        int pagosAsignados    = paymentRepository.assignOrphansToPeriod(consortiumId, primer.getId());

        log.info("[PeriodService] Primer período creado para consorcio {}. Expenses asignados: {}, Pagos: {}",
                consortiumId, expensesAsignados, pagosAsignados);

        return primer;
    }

    private void assertAdmin(Long consortiumId, String callerEmail) {
        User user = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        boolean isAdmin = memberRepository.existsByConsortiumIdAndUserIdAndRole(
                consortiumId, user.getId(), ConsortiumRole.ADMIN);
        if (!isAdmin) throw new ForbiddenException("Solo el administrador puede cerrar un período");
    }

    private PeriodDto toDto(Period p) {
        List<PeriodMemberSnapshotDto> snapshots = snapshotRepository
                .findByPeriodId(p.getId())
                .stream()
                .map(s -> new PeriodMemberSnapshotDto(s.getUserId(), s.getNombreMiembro(), s.getBalanceAlCierre()))
                .toList();

        List<ExpenseDetailDTO> expenses = expenseRepository
                .findByConsortiumIdAndPeriodIdOrderByFechaGastoDescCreatedAtDesc(
                        p.getConsortium().getId(), p.getId())
                .stream()
                .map(e -> new ExpenseDetailDTO(
                        String.valueOf(e.getId()),
                        e.getDescripcion(),
                        e.getCategoria(),
                        e.getTipoGasto().name(),
                        e.getMonto(),
                        e.getFechaGasto()))
                .toList();

        BigDecimal totalGastos = expenseRepository.sumMontoByPeriodId(p.getId());
        BigDecimal totalPagos  = paymentRepository.sumMontoByPeriodId(p.getId());

        return new PeriodDto(
                p.getId(),
                p.getConsortium().getId(),
                p.getMes(),
                p.getAnio(),
                p.getEstado().name(),
                p.getFechaApertura().toString(),
                p.getFechaCierre() != null ? p.getFechaCierre().toString() : null,
                p.getSaldoInicialFondo(),
                p.getSaldoFinalFondo(),
                totalGastos,
                totalPagos,
                snapshots,
                expenses
        );
    }
}
