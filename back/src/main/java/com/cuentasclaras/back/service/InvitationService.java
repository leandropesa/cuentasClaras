package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.InvitationAcceptResponse;
import com.cuentasclaras.back.dto.InvitationDto;
import com.cuentasclaras.back.dto.InvitationProcessResponse;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.ConsortiumRepository;
import com.cuentasclaras.back.repository.InvitationRepository;
import com.cuentasclaras.back.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationService {

    private final ConsortiumRepository consortiumRepository;
    private final ConsortiumMemberRepository consortiumMemberRepository;
    private final UserRepository userRepository;
    private final InvitationRepository invitationRepository;

    public InvitationService(ConsortiumRepository consortiumRepository,
                             ConsortiumMemberRepository consortiumMemberRepository,
                             UserRepository userRepository,
                             InvitationRepository invitationRepository) {
        this.consortiumRepository = consortiumRepository;
        this.consortiumMemberRepository = consortiumMemberRepository;
        this.userRepository = userRepository;
        this.invitationRepository = invitationRepository;
    }

    @Transactional
    public InvitationDto inviteMember(Long consortiumId, String email, String callerEmail) {
        return inviteMember(consortiumId, email, null, callerEmail);
    }

    @Transactional
    public InvitationDto inviteMember(Long consortiumId, String email, BigDecimal metrosCuadrados, String callerEmail) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consortium not found"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede invitar miembros a este consorcio");

        String normalizedEmail = email.trim().toLowerCase();

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            boolean alreadyMember = consortiumMemberRepository
                    .findByConsortiumIdAndUserId(consortiumId, user.getId()).isPresent();
            if (alreadyMember) {
                throw new IllegalArgumentException("El usuario ya es parte del consorcio");
            }
        });

        Invitation invitation = invitationRepository
                .findByConsortiumIdAndEmailAndStatus(consortiumId, normalizedEmail, InvitationStatus.PENDING)
                .orElseGet(() -> new Invitation(consortium, normalizedEmail, UUID.randomUUID().toString()));

        if (metrosCuadrados != null) {
            invitation.setMetrosCuadrados(metrosCuadrados);
        }

        invitationRepository.save(invitation);

        return toInvitationDto(invitation);
    }

    @Transactional
    public InvitationAcceptResponse acceptInvitation(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invitación no encontrada"));

        if (invitation.getStatus() == InvitationStatus.PENDING) {
            invitation.setStatus(InvitationStatus.ACCEPTED);
            invitation.setAcceptedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
        }

        return new InvitationAcceptResponse(
                invitation.getConsortium().getId(),
                invitation.getConsortium().getName(),
                invitation.getStatus()
        );
    }

    @Transactional
    public InvitationProcessResponse processAcceptedInvitations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        List<Invitation> accepted = invitationRepository.findByEmailAndStatus(
                user.getEmail().toLowerCase(), InvitationStatus.ACCEPTED
        );

        int processed = 0;
        for (Invitation invitation : accepted) {
            boolean alreadyMember = consortiumMemberRepository
                    .findByConsortiumIdAndUserId(invitation.getConsortium().getId(), user.getId())
                    .isPresent();
            if (!alreadyMember) {
                ConsortiumMember newMember = new ConsortiumMember(
                        invitation.getConsortium(), user, ConsortiumRole.MEMBER
                );
                if (invitation.getMetrosCuadrados() != null) {
                    newMember.setMetrosCuadrados(invitation.getMetrosCuadrados());
                }
                consortiumMemberRepository.save(newMember);
            }

            invitation.setStatus(InvitationStatus.PROCESSED);
            invitation.setProcessedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
            processed++;
        }

        return new InvitationProcessResponse(processed);
    }

    @Transactional
    public InvitationDto updateInvitationMetrosCuadrados(Long consortiumId, Long invitationId,
                                                 BigDecimal metrosCuadrados, String callerEmail) {
        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado"));

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede modificar los metros cuadrados de una invitación");

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitación no encontrada"));

        if (!invitation.getConsortium().getId().equals(consortiumId)) {
            throw new IllegalArgumentException("La invitación no pertenece a este consorcio");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Solo se puede modificar los metros cuadrados de invitaciones pendientes");
        }

        invitation.setMetrosCuadrados(metrosCuadrados);
        invitationRepository.save(invitation);

        return toInvitationDto(invitation);
    }

    private void requireAdmin(Long consortiumId, Long userId, String message) {
        boolean isAdmin = consortiumMemberRepository
                .existsByConsortiumIdAndUserIdAndRole(consortiumId, userId, ConsortiumRole.ADMIN);
        if (!isAdmin) throw new ForbiddenException(message);
    }

    public InvitationDto toInvitationDto(Invitation invitation) {
        return new InvitationDto(
                invitation.getId(),
                invitation.getConsortium().getId(),
                invitation.getConsortium().getName(),
                invitation.getEmail(),
                invitation.getStatus(),
                invitation.getCreatedAt(),
                invitation.getAcceptedAt(),
                invitation.getProcessedAt(),
                invitation.getMetrosCuadrados()
        );
    }
}
