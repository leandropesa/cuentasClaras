package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.AddMemberRequest;
import com.cuentasclaras.back.dto.CreateFamilyHomeExpenseRequest;
import com.cuentasclaras.back.dto.CreateFamilyHomeRequest;
import com.cuentasclaras.back.dto.FamilyHomeDto;
import com.cuentasclaras.back.dto.FamilyHomeExpenseDto;
import com.cuentasclaras.back.dto.FamilyHomeMemberDto;
import com.cuentasclaras.back.dto.FamilyHomePaymentRequest;
import com.cuentasclaras.back.dto.JoinByCodeRequest;
import com.cuentasclaras.back.dto.UpdateFamilyHomeNameRequest;
import com.cuentasclaras.back.dto.UpdateMemberRoleRequest;
import com.cuentasclaras.back.service.FamilyHomeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family-homes")
public class FamilyHomeController {

    private final FamilyHomeService familyHomeService;

    public FamilyHomeController(FamilyHomeService familyHomeService) {
        this.familyHomeService = familyHomeService;
    }

    /** GET /api/family-homes/by-code/{code} */
    @GetMapping("/by-code/{code}")
    public FamilyHomeDto getByCode(@PathVariable String code) {
        return familyHomeService.getByCode(code);
    }

    /** POST /api/family-homes/join-by-code */
    @PostMapping("/join-by-code")
    public FamilyHomeDto joinByCode(
            @Valid @RequestBody JoinByCodeRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.joinByCode(request.code(), principal.getUsername());
    }

    /** POST /api/family-homes */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FamilyHomeDto create(
            @Valid @RequestBody CreateFamilyHomeRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.create(request, principal.getUsername());
    }

    /** GET /api/family-homes/mine */
    @GetMapping("/mine")
    public List<FamilyHomeDto> getMine(@AuthenticationPrincipal UserDetails principal) {
        return familyHomeService.getMine(principal.getUsername());
    }

    /** GET /api/family-homes/{id} */
    @GetMapping("/{id}")
    public FamilyHomeDto getById(@PathVariable Long id) {
        return familyHomeService.getById(id);
    }

    /** POST /api/family-homes/{id}/members */
    @PostMapping("/{id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public FamilyHomeDto addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.addMember(id, request, principal.getUsername());
    }

    /** DELETE /api/family-homes/{id}/members/{userId} */
    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails principal
    ) {
        familyHomeService.removeMember(id, userId, principal.getUsername());
    }

    /** DELETE /api/family-homes/{id}/members/me */
    @DeleteMapping("/{id}/members/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        familyHomeService.leave(id, principal.getUsername());
    }

    /** PUT /api/family-homes/{id}/name */
    @PutMapping("/{id}/name")
    public FamilyHomeDto updateName(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFamilyHomeNameRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.updateName(id, request.name(), principal.getUsername());
    }

    /** PUT /api/family-homes/{id}/members/{userId}/role */
    @PutMapping("/{id}/members/{userId}/role")
    public FamilyHomeDto updateRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.updateMemberRole(id, userId, request.role(), principal.getUsername());
    }

    /** POST /api/family-homes/{id}/expenses */
    @PostMapping("/{id}/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public FamilyHomeExpenseDto createExpense(
            @PathVariable Long id,
            @Valid @RequestBody CreateFamilyHomeExpenseRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.createExpense(request, principal.getUsername());
    }

    /** GET /api/family-homes/{id}/expenses */
    @GetMapping("/{id}/expenses")
    public List<FamilyHomeExpenseDto> getExpenses(@PathVariable Long id) {
        return familyHomeService.getExpenses(id);
    }

    /** GET /api/family-homes/{id}/balance */
    @GetMapping("/{id}/balance")
    public List<FamilyHomeMemberDto> getBalance(@PathVariable Long id) {
        return familyHomeService.getBalance(id);
    }

    /** POST /api/family-homes/{id}/pay — cualquier miembro puede notificar su pago */
    @PostMapping("/{id}/pay")
    public FamilyHomeDto pay(
            @PathVariable Long id,
            @Valid @RequestBody FamilyHomePaymentRequest request,
            @AuthenticationPrincipal UserDetails principal
    ) {
        return familyHomeService.pay(id, request.monto(), principal.getUsername());
    }
}