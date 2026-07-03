package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.CreateRecurringTemplateRequest;
import com.cuentasclaras.back.dto.RecurringTemplateDto;
import com.cuentasclaras.back.dto.UpdateRecurringMontoRequest;
import com.cuentasclaras.back.service.RecurringExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurrentes")
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseController(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringTemplateDto crear(
            @Valid @RequestBody CreateRecurringTemplateRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return recurringExpenseService.createTemplate(request, principal.getUsername());
    }

    @GetMapping("/{grupoId}")
    public List<RecurringTemplateDto> listar(
            @PathVariable Long grupoId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return recurringExpenseService.getTemplates(grupoId, principal.getUsername());
    }

    @PutMapping("/{id}/monto")
    public RecurringTemplateDto actualizarMonto(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRecurringMontoRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return recurringExpenseService.updateMonto(id, request, principal.getUsername());
    }

    @PutMapping("/{id}/toggle")
    public RecurringTemplateDto toggle(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return recurringExpenseService.toggleActivo(id, principal.getUsername());
    }


    @PostMapping("/{id}/aplicar")
    public RecurringTemplateDto aplicar(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return recurringExpenseService.applyManually(id, principal.getUsername());
    }
}
