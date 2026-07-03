package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.ComprobanteDto;
import com.cuentasclaras.back.dto.RejectComprobanteRequest;
import com.cuentasclaras.back.service.ComprobanteService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/comprobantes")
public class ComprobanteController {

    private final ComprobanteService comprobanteService;

    public ComprobanteController(ComprobanteService comprobanteService) {
        this.comprobanteService = comprobanteService;
    }

    /** Sube el comprobante de un pago. Solo el dueño del pago puede hacerlo. */
    @PostMapping(value = "/pago/{paymentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ComprobanteDto upload(
            @PathVariable Long paymentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return comprobanteService.upload(paymentId, file, principal.getUsername());
    }

    /** Admin: aprueba un comprobante en estado PENDIENTE. */
    @PostMapping("/{comprobanteId}/aprobar")
    public ComprobanteDto approve(
            @PathVariable Long comprobanteId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return comprobanteService.approve(comprobanteId, principal.getUsername());
    }

    /** Admin: rechaza un comprobante en estado PENDIENTE con un motivo. */
    @PostMapping("/{comprobanteId}/rechazar")
    public ComprobanteDto reject(
            @PathVariable Long comprobanteId,
            @RequestBody RejectComprobanteRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return comprobanteService.reject(comprobanteId, request.motivo(), principal.getUsername());
    }

    /** Descarga el archivo del comprobante. Solo miembros del consorcio. */
    @GetMapping("/{comprobanteId}/archivo")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long comprobanteId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        Resource resource = comprobanteService.getFile(comprobanteId, principal.getUsername());
        String contentType = "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    /** Admin: lista todos los comprobantes PENDIENTES del grupo. */
    @GetMapping("/pendientes/{grupoId}")
    public List<ComprobanteDto> getPendientes(
            @PathVariable String grupoId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return comprobanteService.getPendientes(Long.parseLong(grupoId), principal.getUsername());
    }
}
