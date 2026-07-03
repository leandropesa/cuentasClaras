package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.util.List;

public record FundSummaryDto(
        BigDecimal saldo,
        BigDecimal totalIngresos,
        BigDecimal totalEgresos,
        List<FundMovementDto> movimientos
) {}