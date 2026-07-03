// back/src/main/java/com/cuentasclaras/back/service/FundService.java
package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.CreateFundMovementRequest;
import com.cuentasclaras.back.dto.FundMovementDto;
import com.cuentasclaras.back.dto.FundSummaryDto;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class FundService {

    private final FundMovementRepository     fundMovementRepository;
    private final ConsortiumRepository       consortiumRepository;
    private final ConsortiumMemberRepository memberRepository;
    private final UserRepository             userRepository;

    public FundService(FundMovementRepository fundMovementRepository,
                       ConsortiumRepository consortiumRepository,
                       ConsortiumMemberRepository memberRepository,
                       UserRepository userRepository) {
        this.fundMovementRepository = fundMovementRepository;
        this.consortiumRepository   = consortiumRepository;
        this.memberRepository       = memberRepository;
        this.userRepository         = userRepository;
    }

    @Transactional(readOnly = true)
    public FundSummaryDto getSummary(Long consortiumId) {
        assertConsortiumExists(consortiumId);

        BigDecimal saldo         = fundMovementRepository.calcularSaldo(consortiumId);
        BigDecimal totalIngresos = fundMovementRepository
                .sumByConsortiumIdAndTipo(consortiumId, FundMovementType.INGRESO);
        BigDecimal totalEgresos  = fundMovementRepository
                .sumByConsortiumIdAndTipo(consortiumId, FundMovementType.EGRESO);

        List<FundMovementDto> movimientos = fundMovementRepository
                .findByConsortiumIdOrderByFechaMovimientoDescCreatedAtDesc(consortiumId)
                .stream()
                .map(this::toDto)
                .toList();

        return new FundSummaryDto(saldo, totalIngresos, totalEgresos, movimientos);
    }

    @Transactional
    public FundMovementDto createMovement(CreateFundMovementRequest req, String callerEmail) {
        Long consortiumId = parseId(req.grupoId());
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado: " + req.grupoId()));

        FundMovementType tipo;
        try {
            tipo = FundMovementType.valueOf(req.tipo().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("tipo inválido. Valores: INGRESO, EGRESO");
        }

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        LocalDate fecha = (req.fecha() == null || req.fecha().isBlank())
                ? LocalDate.now()
                : LocalDate.parse(req.fecha());

        FundMovement movement = new FundMovement(
                consortium, tipo, req.concepto(), req.monto(), caller, fecha
        );
        fundMovementRepository.save(movement);

        // ── INGRESO → acreditar al miembro que aportó ─────────────────────────
        // El miembro que pone plata al fondo gana crédito por ese monto completo.
        // Cuando se registre un gasto EN_MOMENTO, se descuenta la cuota proporcional
        // de todos, lo cual reduce el crédito del que aportó.
        if (tipo == FundMovementType.INGRESO) {
            memberRepository
                    .findByConsortiumIdAndUserId(consortiumId, caller.getId())
                    .ifPresent(member -> {
                        member.setBalance(member.getBalance().add(req.monto()));
                        memberRepository.save(member);
                    });
        }

        // Los EGRESOS manuales desde el fondo son solo contables.
        // No distribuyen deuda: eso lo hace createExpense en FinanceService.

        return toDto(movement);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private FundMovementDto toDto(FundMovement m) {
        String registradoPor = m.getRegistradoPor() != null
                ? m.getRegistradoPor().getNombre()
                : null;
        return new FundMovementDto(
                m.getId(),
                m.getTipo().name(),
                m.getConcepto(),
                m.getMonto(),
                registradoPor,
                m.getFechaMovimiento().toString()
        );
    }

    private void assertConsortiumExists(Long id) {
        if (!consortiumRepository.existsById(id)) {
            throw new IllegalArgumentException("Grupo no encontrado: " + id);
        }
    }

    private Long parseId(String id) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de grupo inválido: " + id);
        }
    }
}