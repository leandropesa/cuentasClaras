package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

public record MonthlyReportDTO(
    YearMonth month,
    BigDecimal totalExpenses,
    BigDecimal totalPayments,
    List<ExpenseDetailDTO> expenses,
    List<PaymentDetailDTO> payments,
    List<DelinquentMemberDTO> delinquentMembers,
    BigDecimal monthlyBalance,
    LocalDateTime generatedAt,
    String consortiumName
) {}
