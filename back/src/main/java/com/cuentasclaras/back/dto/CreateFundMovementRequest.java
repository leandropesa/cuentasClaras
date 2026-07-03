package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateFundMovementRequest(
        @NotBlank String grupoId,
        @NotBlank String tipo,       // "INGRESO" | "EGRESO"
        @NotBlank String concepto,
        @NotNull  BigDecimal monto,
        String fecha                 // opcional, default = hoy
) {}