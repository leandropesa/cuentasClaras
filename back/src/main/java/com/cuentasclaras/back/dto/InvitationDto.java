package com.cuentasclaras.back.dto;

import com.cuentasclaras.back.entity.InvitationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InvitationDto(
        Long id,
        Long consortiumId,
        String consortiumName,
        String email,
        InvitationStatus status,
        LocalDateTime createdAt,
        LocalDateTime acceptedAt,
        LocalDateTime processedAt,
        BigDecimal metrosCuadrados
) {}
