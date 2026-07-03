package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ConsortiumDto(
        Long id,
        String name,
        BigDecimal initialBalance,
        LocalDateTime createdAt,
        List<ConsortiumMemberDto> members,
        String invitationCode,
        String cbu,
        String alias,
        String titular,
        List<InvitationDto> pendingInvitations,
        Integer diaCierre
) {}
