package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.BalanceRowDto;
import com.cuentasclaras.back.dto.CreateExpenseRequest;
import com.cuentasclaras.back.dto.CreatePaymentRequest;
import com.cuentasclaras.back.dto.DashboardDto;
import com.cuentasclaras.back.dto.ExpenseDto;
import com.cuentasclaras.back.dto.PaymentDto;
import com.cuentasclaras.back.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/dashboard/{grupoId}")
    public DashboardDto getDashboard(@PathVariable String grupoId) {
        return financeService.getDashboard(grupoId);
    }

    @GetMapping("/balance/{grupoId}")
    public List<BalanceRowDto> getBalance(@PathVariable String grupoId) {
        return financeService.getBalance(grupoId);
    }

    @GetMapping("/gastos/{grupoId}")
    public List<ExpenseDto> getGastos(@PathVariable String grupoId) {
        return financeService.getGastos(grupoId);
    }

    /**
     * POST /api/gastos
     * Crea un gasto. Si tipoGasto = FIJO, el caller debe ser ADMIN del grupo.
     * Si tipoGasto = EXTRAORDINARIO (o no viene), cualquier miembro puede crearlo.
     */
    @PostMapping("/gastos")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseDto createExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return financeService.createExpense(request, principal.getUsername());
    }

    @GetMapping("/pagos/{grupoId}")
    public List<PaymentDto> getPagos(@PathVariable String grupoId) {
        return financeService.getPagos(grupoId);
    }

    @PostMapping("/pagos")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentDto createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return financeService.createPayment(request, principal.getUsername());
    }
}