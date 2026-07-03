package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.MoraNotificationDto;
import com.cuentasclaras.back.dto.SetDueDateRequest;
import com.cuentasclaras.back.service.MoraService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mora")
public class MoraController {

    private final MoraService moraService;
    public MoraController(MoraService moraService) { this.moraService = moraService; }

    /** Admin: lista todos los miembros en mora del consorcio. */
    @GetMapping("/consorcio/{consortiumId}")
    public List<MoraNotificationDto> getMiembrosEnMora(
            @PathVariable Long consortiumId,
            @AuthenticationPrincipal UserDetails principal) {
        return moraService.getMiembrosEnMora(consortiumId, principal.getUsername());
    }

    /** El usuario consulta su propio estado. 204 si está AL_DIA. */
    @GetMapping("/mi-estado/{consortiumId}")
    public ResponseEntity<MoraNotificationDto> getMiEstado(
            @PathVariable Long consortiumId,
            @AuthenticationPrincipal UserDetails principal) {
        var dto = moraService.getMiEstadoDeMora(consortiumId, principal.getUsername());
        return dto == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(dto);
    }

    /** Admin: establece/actualiza la fecha de vencimiento de un miembro. */
    @PutMapping("/fecha-vencimiento")
    public ResponseEntity<Void> setFechaVencimiento(
            @Valid @RequestBody SetDueDateRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        moraService.setFechaVencimiento(req, principal.getUsername());
        return ResponseEntity.ok().build();
    }

    /** Admin: recupera y marca como notificados los morosos pendientes. */
    @PostMapping("/notificar/{consortiumId}")
    public List<MoraNotificationDto> notificar(
            @PathVariable Long consortiumId,
            @AuthenticationPrincipal UserDetails principal) {
        return moraService.marcarNotificacionesEnviadas(consortiumId, principal.getUsername());
    }

    /** Trigger manual del scheduler (útil en desarrollo). */
    @PostMapping("/evaluar")
    public ResponseEntity<String> evaluar() {
        moraService.evaluarMoraDiaria();
        return ResponseEntity.ok("Evaluación de mora completada");
    }
}