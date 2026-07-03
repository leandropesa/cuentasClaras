package com.cuentasclaras.back.entity;

public enum ExpenseType {
    /** Gasto fijo / expensa mensual. Solo lo puede cargar el ADMIN. */
    FIJO,
    /** Gasto extraordinario / variable. Lo puede cargar cualquier miembro. */
    EXTRAORDINARIO
}