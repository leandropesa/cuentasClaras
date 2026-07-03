package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record FamilyHomeMemberDto(
        Long userId,
        String name,
        String email,
        String role,
        BigDecimal balance
) {}
