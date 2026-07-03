// ── CreateConsortiumRequest.java ──────────────────────────────────────────────
package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateConsortiumRequest(
        @NotBlank String name,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal initialBalance,
        String cbu,
        String alias,
        String titular
) {}
