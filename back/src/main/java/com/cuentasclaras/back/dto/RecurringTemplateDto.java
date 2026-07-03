package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record RecurringTemplateDto(
        Long id,
        Long consortiumId,
        String descripcion,
        BigDecimal monto,
        String categoria,
        String cargadoPorEmail,
        boolean activo,
        Integer lastGeneratedYear,
        Integer lastGeneratedMonth,
        String createdAt
) {}
