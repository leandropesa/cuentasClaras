// back/src/main/java/com/cuentasclaras/back/entity/ExpenseSubType.java
package com.cuentasclaras.back.entity;

public enum ExpenseSubType {
    /**
     * Solo aplica a EXTRAORDINARIO.
     * El gasto se acumula para la próxima liquidación de expensas,
     * igual que un gasto FIJO. No toca el fondo.
     */
    CONVENIO,

    /**
     * Solo aplica a EXTRAORDINARIO.
     * Debe pagarse ahora mismo del fondo común.
     * Si el fondo no alcanza, se bloquea hasta que haya saldo suficiente.
     */
    EN_MOMENTO
}