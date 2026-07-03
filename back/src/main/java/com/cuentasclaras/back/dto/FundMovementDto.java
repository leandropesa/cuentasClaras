package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record FundMovementDto(
        Long id,
        String tipo,          // "INGRESO" | "EGRESO"
        String concepto,
        BigDecimal monto,
        String registradoPor, // nombre del usuario, puede ser null
        String fecha
) {}