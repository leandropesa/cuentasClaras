package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateFamilyHomeExpenseRequest(
        @NotNull  Long familyHomeId,
        @NotBlank String descripcion,
        @NotNull  BigDecimal monto,
        @NotBlank String categoria,
        String fecha,        // opcional, default hoy
        @NotBlank String cargadoPor
) {}