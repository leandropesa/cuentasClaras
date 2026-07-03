package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreatePaymentRequest(
        @NotBlank String grupoId,
        @NotNull BigDecimal monto,
        String fecha
) {}
