package com.cuentasclaras.back.dto;

public record UpdateBankDetailsRequest(
        String cbu,
        String alias,
        String titular
) {}
