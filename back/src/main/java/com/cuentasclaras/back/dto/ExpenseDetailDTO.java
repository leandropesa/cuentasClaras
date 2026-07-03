package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseDetailDTO(
    String expenseId,
    String descripcion,
    String categoria,
    String tipoGasto,
    BigDecimal monto,
    LocalDate fecha
) {}
