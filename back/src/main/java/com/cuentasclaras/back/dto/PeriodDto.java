package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.util.List;

public record PeriodDto(
        Long id,
        Long consortiumId,
        int mes,
        int anio,
        String estado,
        String fechaApertura,
        String fechaCierre,
        BigDecimal saldoInicialFondo,
        BigDecimal saldoFinalFondo,
        BigDecimal totalGastos,
        BigDecimal totalPagos,
        List<PeriodMemberSnapshotDto> snapshots,
        List<ExpenseDetailDTO> expenses
) {}
