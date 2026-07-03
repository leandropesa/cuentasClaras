package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record JoinByCodeRequest(
        @NotBlank String code,
        BigDecimal metrosCuadrados
) {}
