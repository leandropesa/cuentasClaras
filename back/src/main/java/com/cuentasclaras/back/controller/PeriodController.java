package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.PeriodDto;
import com.cuentasclaras.back.service.PeriodService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/periodos")
public class PeriodController {

    private final PeriodService periodService;

    public PeriodController(PeriodService periodService) {
        this.periodService = periodService;
    }

    @GetMapping("/{consortiumId}/actual")
    public PeriodDto getActual(@PathVariable Long consortiumId) {
        return periodService.getCurrentPeriodDto(consortiumId);
    }

    @GetMapping("/{consortiumId}")
    public List<PeriodDto> getHistorial(@PathVariable Long consortiumId) {
        return periodService.getHistorial(consortiumId);
    }

    @GetMapping("/{consortiumId}/{periodId}")
    public PeriodDto getDetalle(@PathVariable Long consortiumId, @PathVariable Long periodId) {
        return periodService.getPeriodDetail(consortiumId, periodId);
    }

    @PostMapping("/{consortiumId}/cerrar")
    public PeriodDto cerrar(
            @PathVariable Long consortiumId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return periodService.closePeriod(consortiumId, principal.getUsername());
    }
}
