package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentDetailDTO(
    String paymentId,
    String memberName,
    BigDecimal amount,
    LocalDate paymentDate
) {}
