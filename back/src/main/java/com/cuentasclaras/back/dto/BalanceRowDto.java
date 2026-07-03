package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record BalanceRowDto(
        String socioId,
        String nombre,
        BigDecimal aportado,
        BigDecimal pagado,
        BigDecimal objetivo,
        BigDecimal balance
) {
}
