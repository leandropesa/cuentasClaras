// back/src/main/java/com/cuentasclaras/back/controller/FundController.java
package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.CreateFundMovementRequest;
import com.cuentasclaras.back.dto.FundMovementDto;
import com.cuentasclaras.back.dto.FundSummaryDto;
import com.cuentasclaras.back.service.FundService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fondo")
public class FundController {

    private final FundService fundService;

    public FundController(FundService fundService) {
        this.fundService = fundService;
    }

    /** GET /api/fondo/{grupoId} — saldo + movimientos del grupo */
    @GetMapping("/{grupoId}")
    public FundSummaryDto getSummary(@PathVariable Long grupoId) {
        return fundService.getSummary(grupoId);
    }

    /** POST /api/fondo — registrar ingreso o egreso */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FundMovementDto createMovement(
            @Valid @RequestBody CreateFundMovementRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return fundService.createMovement(request, principal.getUsername());
    }
}