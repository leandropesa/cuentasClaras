package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateRecurringMontoRequest(
        @NotNull BigDecimal monto
) {}
