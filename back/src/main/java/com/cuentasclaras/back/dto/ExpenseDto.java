// back/src/main/java/com/cuentasclaras/back/dto/ExpenseDto.java
package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record ExpenseDto(
        String id,
        String grupoId,
        String descripcion,
        BigDecimal monto,
        String categoria,
        String fecha,
        String cargadoPor,
        String tipoGasto,   // "FIJO" | "EXTRAORDINARIO"
        String subTipo      // "CONVENIO" | "EN_MOMENTO" | null
) {}