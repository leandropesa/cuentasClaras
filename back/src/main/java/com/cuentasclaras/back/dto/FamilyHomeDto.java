package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record FamilyHomeDto(
        Long id,
        String name,
        LocalDateTime createdAt,
        String invitationCode,
        List<FamilyHomeMemberDto> members
) {}