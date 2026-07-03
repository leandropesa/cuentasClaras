package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record DelinquentMemberDTO(
    String memberId,
    String memberName,
    BigDecimal debt
) {}
