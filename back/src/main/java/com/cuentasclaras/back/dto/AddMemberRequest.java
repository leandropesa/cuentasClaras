package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record AddMemberRequest(
        @NotBlank String username,
        @Positive(message = "Los metros cuadrados deben ser un número positivo")
        BigDecimal metrosCuadrados
) {}