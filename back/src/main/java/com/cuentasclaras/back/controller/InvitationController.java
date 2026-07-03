package com.cuentasclaras.back.controller;

import com.cuentasclaras.back.dto.InvitationAcceptResponse;
import com.cuentasclaras.back.dto.InvitationProcessResponse;
import com.cuentasclaras.back.service.InvitationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    /** GET /api/invitations/accept?token=... */
    @GetMapping("/accept")
    public InvitationAcceptResponse accept(@RequestParam String token) {
        return invitationService.acceptInvitation(token);
    }

    /** POST /api/invitations/process-mine */
    @PostMapping("/process-mine")
    public InvitationProcessResponse processMine(@AuthenticationPrincipal UserDetails principal) {
        return invitationService.processAcceptedInvitations(principal.getUsername());
    }
}
