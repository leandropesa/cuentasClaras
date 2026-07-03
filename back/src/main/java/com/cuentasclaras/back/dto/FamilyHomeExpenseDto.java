package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record FamilyHomeExpenseDto(
        Long id,
        Long familyHomeId,
        String descripcion,
        BigDecimal monto,
        String categoria,
        String fecha,
        String cargadoPor
) {}