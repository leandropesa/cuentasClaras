package com.cuentasclaras.back.dto;
import java.math.BigDecimal;

public record MoraNotificationDto(
        Long consortiumId, String consortiumName,
        Long userId, String userName, String userEmail,
        BigDecimal deuda,
        String fechaVencimiento, String moraDesdeFecha,
        long diasEnMora,
        boolean adminNotificado
) {}