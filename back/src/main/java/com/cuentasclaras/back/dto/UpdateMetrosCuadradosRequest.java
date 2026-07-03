package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * Request para actualizar los metros cuadrados de un miembro (solo para admins).
 * Los m² se usan para cálculos proporcionales de gastos FIJOS.
 */
public record UpdateMetrosCuadradosRequest(
        @NotNull(message = "Los metros cuadrados no pueden ser nulos")
        @Positive(message = "Los metros cuadrados deben ser un número positivo")
        BigDecimal metrosCuadrados
) {}
