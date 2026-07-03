package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record PeriodMemberSnapshotDto(
        Long userId,
        String nombreMiembro,
        BigDecimal balanceAlCierre
) {}
