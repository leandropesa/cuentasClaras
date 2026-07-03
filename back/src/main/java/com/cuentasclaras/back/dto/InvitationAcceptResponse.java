package com.cuentasclaras.back.dto;

import com.cuentasclaras.back.entity.InvitationStatus;

public record InvitationAcceptResponse(
        Long consortiumId,
        String consortiumName,
        InvitationStatus status
) {}
