package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.AddMemberRequest;
import com.cuentasclaras.back.dto.ConsortiumDto;
import com.cuentasclaras.back.dto.InvitationDto;
import com.cuentasclaras.back.dto.CreateConsortiumRequest;
import com.cuentasclaras.back.dto.UpdateConsortiumNameRequest;
import com.cuentasclaras.back.dto.UpdateBankDetailsRequest;
import com.cuentasclaras.back.dto.JoinByCodeRequest;
import com.cuentasclaras.back.dto.UpdateMetrosCuadradosRequest;
import com.cuentasclaras.back.service.ConsortiumService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consortiums")
public class ConsortiumController {

    private final ConsortiumService consortiumService;

    public ConsortiumController(ConsortiumService consortiumService) {
        this.consortiumService = consortiumService;
    }

    /** POST /api/consortiums — crea consorcio; el caller se vuelve ADMIN. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConsortiumDto create(
            @Valid @RequestBody CreateConsortiumRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.create(request, principal.getUsername());
    }

    /** GET /api/consortiums — devuelve todos (admin/debug). */
    @GetMapping
    public List<ConsortiumDto> getAll() {
        return consortiumService.getAll();
    }

    /**
     * GET /api/consortiums/mine
     * Devuelve únicamente los consorcios donde el usuario autenticado es miembro.
     * Es el endpoint que debe usar el frontend para "Mis Grupos".
     */
    @GetMapping("/mine")
    public List<ConsortiumDto> getMine(@AuthenticationPrincipal UserDetails principal) {
        return consortiumService.getMine(principal.getUsername());
    }

    /** GET /api/consortiums/{id} */
    @GetMapping("/{id}")
    public ConsortiumDto getById(@PathVariable Long id) {
        return consortiumService.getById(id);
    }

    /** POST /api/consortiums/{id}/members — ADMIN envía invitación por email. */
    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public InvitationDto addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.addMember(id, request, principal.getUsername());
    }

    /** GET /api/consortiums/by-code/{code} — busca grupo por código (sin unirse). */
    @GetMapping("/by-code/{code}")
    public ConsortiumDto getByCode(@PathVariable String code) {
        return consortiumService.getByInvitationCode(code);
    }

    /** POST /api/consortiums/join-by-code — Unirse a un grupo mediante código. */
    @PostMapping("/join-by-code")
    public ConsortiumDto joinByCode(
            @Valid @RequestBody JoinByCodeRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.joinByCode(request, principal.getUsername());
    }

    /** POST /api/consortiums/{id}/members/{userId}/promote */
    @PostMapping("/{id}/members/{userId}/promote")
    public ConsortiumDto promoteToAdmin(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.promoteToAdmin(id, userId, principal.getUsername());
    }

    /** POST /api/consortiums/{id}/members/{userId}/demote */
    @PostMapping("/{id}/members/{userId}/demote")
    public ConsortiumDto demoteFromAdmin(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.demoteFromAdmin(id, userId, principal.getUsername());
    }

    /** DELETE /api/consortiums/{id}/members/{userId} */
    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        consortiumService.removeMember(id, userId, principal.getUsername());
    }

    /** DELETE /api/consortiums/{id}/members/me */
    @DeleteMapping("/{id}/members/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        consortiumService.leaveConsortium(id, principal.getUsername());
    }

    /** DELETE /api/consortiums/{id} — solo ADMIN puede eliminar el grupo */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        consortiumService.deleteConsortium(id, principal.getUsername());
    }

    /** PUT /api/consortiums/{id}/bank-details — solo ADMIN puede modificar datos bancarios */
    @PutMapping("/{id}/bank-details")
    public ConsortiumDto updateBankDetails(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBankDetailsRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.updateBankDetails(id, request.cbu(), request.alias(), request.titular(), principal.getUsername());
    }

    /** PUT /api/consortiums/{id}/name — solo ADMIN puede renombrar */
    @PutMapping("/{id}/name")
    public ConsortiumDto updateName(
            @PathVariable Long id,
            @Valid @RequestBody UpdateConsortiumNameRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.updateName(id, request.name(), principal.getUsername());
    }

    /** PUT /api/consortiums/{id}/members/{userId}/metros-cuadrados — Solo ADMIN puede actualizar los m² */
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping("/{id}/members/{userId}/metros-cuadrados")
    public ConsortiumDto updateMemberMetrosCuadrados(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMetrosCuadradosRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.updateMemberMetrosCuadrados(id, userId, request, principal.getUsername());
    }

    /** PUT /api/consortiums/{id}/dia-cierre — Solo ADMIN, configura el día del mes de cierre automático */
    @PutMapping("/{id}/dia-cierre")
    public ConsortiumDto updateDiaCierre(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Integer> body,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.updateDiaCierre(id, body.get("dia"), principal.getUsername());
    }

    /** PUT /api/consortiums/{id}/invitations/{invitationId}/metros-cuadrados — Solo ADMIN, actualiza m² de invitación pendiente */
    @PutMapping("/{id}/invitations/{invitationId}/metros-cuadrados")
    public InvitationDto updateInvitationMetrosCuadrados(
            @PathVariable Long id,
            @PathVariable Long invitationId,
            @Valid @RequestBody UpdateMetrosCuadradosRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return consortiumService.updateInvitationMetrosCuadrados(id, invitationId, request, principal.getUsername());
    }
}