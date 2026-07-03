package com.cuentasclaras.back.entity;

/** AL_DIA → sin deuda vencida. EN_MORA → superó fecha de vencimiento con saldo negativo. */
public enum MembershipStatus {
    AL_DIA,
    EN_MORA
}