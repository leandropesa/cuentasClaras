package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.DelinquentMemberDTO;
import com.cuentasclaras.back.dto.ExpenseDetailDTO;
import com.cuentasclaras.back.dto.MonthlyReportDTO;
import com.cuentasclaras.back.dto.PaymentDetailDTO;
import com.cuentasclaras.back.entity.Consortium;
import com.cuentasclaras.back.entity.ConsortiumMember;
import com.cuentasclaras.back.entity.Expense;
import com.cuentasclaras.back.entity.Payment;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.ConsortiumRepository;
import com.cuentasclaras.back.repository.ExpenseRepository;
import com.cuentasclaras.back.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

@Service
public class ReportService {

    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final ConsortiumMemberRepository memberRepository;
    private final ConsortiumRepository consortiumRepository;

    public ReportService(
            ExpenseRepository expenseRepository,
            PaymentRepository paymentRepository,
            ConsortiumMemberRepository memberRepository,
            ConsortiumRepository consortiumRepository) {
        this.expenseRepository = expenseRepository;
        this.paymentRepository = paymentRepository;
        this.memberRepository = memberRepository;
        this.consortiumRepository = consortiumRepository;
    }

    @Transactional(readOnly = true)
    public MonthlyReportDTO generateMonthlyReport(Long consortiumId, YearMonth yearMonth) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado: " + consortiumId));

        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Calcular gastos del mes
        List<Expense> expenses = expenseRepository.findByConsortiumIdAndFechaGastoBetween(
                consortiumId, startDate, endDate);
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calcular pagos del mes
        List<Payment> payments = paymentRepository.findByConsortiumIdAndFechaPagoBetween(
                consortiumId, startDate, endDate);
        BigDecimal totalPayments = payments.stream()
                .map(Payment::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Detalle de gastos
        List<ExpenseDetailDTO> expenseDetails = expenses.stream()
                .map(e -> new ExpenseDetailDTO(
                        String.valueOf(e.getId()),
                        e.getDescripcion(),
                        e.getCategoria(),
                        e.getTipoGasto() != null ? e.getTipoGasto().name() : "",
                        e.getMonto(),
                        e.getFechaGasto()
                ))
                .toList();

        // Detalle de pagos
        List<PaymentDetailDTO> paymentDetails = payments.stream()
                .map(payment -> new PaymentDetailDTO(
                        String.valueOf(payment.getId()),
                        payment.getUser().getNombre(),
                        payment.getMonto(),
                        payment.getFechaPago()
                ))
                .toList();

        // Miembros morosos (balance negativo)
        List<DelinquentMemberDTO> delinquent = memberRepository.findByConsortiumId(consortiumId)
                .stream()
                .filter(member -> member.getBalance().compareTo(BigDecimal.ZERO) < 0)
                .map(member -> new DelinquentMemberDTO(
                        String.valueOf(member.getId()),
                        member.getUser().getNombre(),
                        member.getBalance().abs()
                ))
                .toList();

        BigDecimal balance = totalPayments.subtract(totalExpenses);

        return new MonthlyReportDTO(
                yearMonth,
                totalExpenses,
                totalPayments,
                expenseDetails,
                paymentDetails,
                delinquent,
                balance,
                LocalDateTime.now(),
                consortium.getName()
        );
    }
}
