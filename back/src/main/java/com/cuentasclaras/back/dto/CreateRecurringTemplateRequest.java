package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateRecurringTemplateRequest(
        @NotBlank String grupoId,
        @NotBlank String descripcion,
        @NotNull  BigDecimal monto,
        @NotBlank String categoria
) {}
