package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record FamilyHomePaymentRequest(
        @NotNull @Positive BigDecimal monto
) {}
