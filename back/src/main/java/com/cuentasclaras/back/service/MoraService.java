package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.MoraNotificationDto;
import com.cuentasclaras.back.dto.SetDueDateRequest;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.exception.MoraException;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MoraService {

    private static final Logger log = LoggerFactory.getLogger(MoraService.class);

    private final ConsortiumMemberRepository memberRepository;
    private final UserRepository             userRepository;

    public MoraService(ConsortiumMemberRepository memberRepository,
                       UserRepository userRepository) {
        this.memberRepository = memberRepository;
        this.userRepository   = userRepository;
    }

    // ── Scheduler diario ──────────────────────────────────────────────────────

    @Scheduled(cron = "0 5 0 * * *")   // todos los días a las 00:05
    @Transactional
    public void evaluarMoraDiaria() {
        log.info("[MoraService] Iniciando evaluación diaria de mora...");
        LocalDate hoy = LocalDate.now();
        List<ConsortiumMember> candidatos = memberRepository.findAllWithFechaVencimiento();

        int nuevasEnMora = 0, salidaDeMora = 0;

        for (ConsortiumMember m : candidatos) {
            boolean tieneDeuda  = m.getBalance().compareTo(BigDecimal.ZERO) < 0;
            boolean vencioFecha = hoy.isAfter(m.getFechaVencimiento());

            if (tieneDeuda && vencioFecha) {
                if (!m.estaEnMora()) {
                    m.setMembershipStatus(MembershipStatus.EN_MORA);
                    m.setMoraDesdeFecha(hoy);
                    m.setAdminNotificado(false);
                    memberRepository.save(m);
                    nuevasEnMora++;
                    log.warn("[Mora] {} entró en mora - consorcio {}",
                             m.getUser().getEmail(), m.getConsortium().getName());
                }
            } else if (m.estaEnMora()) {
                m.setMembershipStatus(MembershipStatus.AL_DIA);
                m.setMoraDesdeFecha(null);
                m.setAdminNotificado(false);
                memberRepository.save(m);
                salidaDeMora++;
                log.info("[Mora] {} salió de mora", m.getUser().getEmail());
            }
        }
        log.info("[MoraService] Completado. Nuevas moras: {}. Salidas: {}.",
                 nuevasEnMora, salidaDeMora);
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    public List<MoraNotificationDto> getMiembrosEnMora(Long consortiumId, String callerEmail) {
        assertAdmin(consortiumId, callerEmail);
        // Muestra todos los miembros con balance negativo, independientemente
        // de si el scheduler ya los marcó formalmente como EN_MORA.
        return memberRepository
                .findByConsortiumIdAndBalanceLessThan(consortiumId, java.math.BigDecimal.ZERO)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public MoraNotificationDto getMiEstadoDeMora(Long consortiumId, String callerEmail) {
        var user = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        var member = memberRepository
                .findByConsortiumIdAndUserId(consortiumId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No eres miembro de este consorcio"));
        boolean debeVerBanner = isEnMoraEfectiva(member)
                || (member.tieneDeuda() && member.isAdminNotificado());
        return debeVerBanner ? toDto(member) : null;
    }

    // ── Configuración ─────────────────────────────────────────────────────────

    @Transactional
    public void setFechaVencimiento(SetDueDateRequest req, String callerEmail) {
        assertAdmin(req.consortiumId(), callerEmail);
        var member = memberRepository
                .findByConsortiumIdAndUserId(req.consortiumId(), req.userId())
                .orElseThrow(() -> new IllegalArgumentException("Miembro no encontrado"));
        member.setFechaVencimiento(LocalDate.parse(req.fechaVencimiento()));
        memberRepository.save(member);
    }

    @Transactional
    public List<MoraNotificationDto> marcarNotificacionesEnviadas(Long consortiumId,
                                                                   String callerEmail) {
        assertAdmin(consortiumId, callerEmail);
        // Marca como notificados todos los morosos pendientes (balance negativo, sin notificar aún)
        var pendientes = memberRepository
                .findByConsortiumIdAndBalanceLessThan(consortiumId, java.math.BigDecimal.ZERO)
                .stream()
                .filter(m -> !m.isAdminNotificado())
                .collect(Collectors.toList());
        var dtos = pendientes.stream().map(this::toDto).collect(Collectors.toList());
        pendientes.forEach(m -> m.setAdminNotificado(true));
        memberRepository.saveAll(pendientes);
        return dtos;
    }

    // ── Restricción de operaciones ────────────────────────────────────────────

    /** Llamar antes de operaciones restringidas a miembros morosos. */
    public void assertNoEnMora(Long consortiumId, String callerEmail) {
        var user = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        memberRepository.findByConsortiumIdAndUserId(consortiumId, user.getId())
                .ifPresent(m -> {
                    if (isEnMoraEfectiva(m)) {
                        LocalDate desde = m.getMoraDesdeFecha() != null
                                ? m.getMoraDesdeFecha()
                                : m.getFechaVencimiento();
                        throw new MoraException(
                            "Tu cuenta está en mora desde " + desde +
                            ". Regularizá tu situación para continuar operando.");
                    }
                });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Un miembro está "en mora efectiva" si el scheduler ya lo marcó formalmente
     * O si tiene balance negativo y su fecha de vencimiento ya pasó.
     * Esto evita depender de que el scheduler haya corrido para bloquear operaciones
     * y mostrar el banner al usuario.
     */
    private boolean isEnMoraEfectiva(ConsortiumMember m) {
        if (m.estaEnMora()) return true;
        return m.tieneDeuda()
                && m.getFechaVencimiento() != null
                && LocalDate.now().isAfter(m.getFechaVencimiento());
    }

    private void assertAdmin(Long consortiumId, String callerEmail) {
        var user = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        boolean isAdmin = memberRepository.existsByConsortiumIdAndUserIdAndRole(
                consortiumId, user.getId(), ConsortiumRole.ADMIN);
        if (!isAdmin) throw new ForbiddenException("Solo el administrador puede hacer esto");
    }

    private MoraNotificationDto toDto(ConsortiumMember m) {
        // moraDesdeFecha: usa el valor formal del scheduler; si no existe, usa fechaVencimiento
        LocalDate moraDesde = m.getMoraDesdeFecha() != null
                ? m.getMoraDesdeFecha()
                : m.getFechaVencimiento();
        long dias = moraDesde != null
                ? Math.max(0L, ChronoUnit.DAYS.between(moraDesde, LocalDate.now()))
                : 0L;
        return new MoraNotificationDto(
                m.getConsortium().getId(), m.getConsortium().getName(),
                m.getUser().getId(), m.getUser().getNombre(), m.getUser().getEmail(),
                m.getBalance().abs(),
                m.getFechaVencimiento() != null ? m.getFechaVencimiento().toString() : null,
                moraDesde != null ? moraDesde.toString() : null,
                dias,
                m.isAdminNotificado()
        );
    }
}