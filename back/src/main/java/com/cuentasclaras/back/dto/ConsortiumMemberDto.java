package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record ConsortiumMemberDto(
        Long userId,
        String name,
        String email,
        String role,
        BigDecimal balance,
        BigDecimal metrosCuadrados,
        String membershipStatus,
        String fechaVencimiento,
        String moraDesdeFecha
) {}