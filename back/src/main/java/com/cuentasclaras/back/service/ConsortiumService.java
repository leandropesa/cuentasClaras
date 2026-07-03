package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.*;
import com.cuentasclaras.back.entity.Consortium;
import com.cuentasclaras.back.entity.ConsortiumMember;
import com.cuentasclaras.back.entity.ConsortiumRole;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.ConsortiumRepository;
import com.cuentasclaras.back.repository.ExpenseRepository;
import com.cuentasclaras.back.repository.FundMovementRepository;
import com.cuentasclaras.back.repository.InvitationRepository;
import com.cuentasclaras.back.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ConsortiumService {

        private final ConsortiumRepository       consortiumRepository;
        private final ConsortiumMemberRepository consortiumMemberRepository;
        private final UserRepository             userRepository;
        private final InvitationService          invitationService;
        private final InvitationRepository       invitationRepository;
        private final ExpenseRepository          expenseRepository;
        private final FundMovementRepository     fundMovementRepository;

        public ConsortiumService(ConsortiumRepository consortiumRepository,
                                                         ConsortiumMemberRepository consortiumMemberRepository,
                                                         UserRepository userRepository,
                                                         InvitationService invitationService,
                                                         InvitationRepository invitationRepository,
                                                         ExpenseRepository expenseRepository,
                                                         FundMovementRepository fundMovementRepository) {
                this.consortiumRepository       = consortiumRepository;
                this.consortiumMemberRepository = consortiumMemberRepository;
                this.userRepository             = userRepository;
                this.invitationService          = invitationService;
                this.invitationRepository       = invitationRepository;
                this.expenseRepository          = expenseRepository;
                this.fundMovementRepository     = fundMovementRepository;
        }

    // ── CRUD básico ───────────────────────────────────────────────────────────

    @Transactional
    public ConsortiumDto create(CreateConsortiumRequest request, String callerEmail) {
        User admin = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        Consortium consortium = new Consortium(request.name(), request.initialBalance());
        consortium.setInvitationCode(generateUniqueCode());
        consortium.setCbu(request.cbu());
        consortium.setAlias(request.alias());
        consortium.setTitular(request.titular());
        consortiumRepository.save(consortium);

        ConsortiumMember adminMember = new ConsortiumMember(consortium, admin, ConsortiumRole.ADMIN);
        consortiumMemberRepository.save(adminMember);
        consortium.getMembers().add(adminMember);

        return toDto(consortium);
    }

    @Transactional(readOnly = true)
    public ConsortiumDto getByInvitationCode(String code) {
        Consortium consortium = consortiumRepository.findByInvitationCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Código de invitación inválido"));
        return toDto(consortium);
    }

    @Transactional
    public ConsortiumDto joinByCode(JoinByCodeRequest request, String callerEmail) {
        Consortium consortium = consortiumRepository.findByInvitationCode(request.code().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Código de invitación inválido"));

        User user = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        boolean alreadyMember = consortiumMemberRepository
                .existsByConsortiumIdAndUserId(consortium.getId(), user.getId());
        if (alreadyMember) {
            throw new IllegalArgumentException("Ya sos miembro de este grupo");
        }

        ConsortiumMember member = new ConsortiumMember(consortium, user, ConsortiumRole.MEMBER);
        if (request.metrosCuadrados() != null) {
            member.setMetrosCuadrados(request.metrosCuadrados());
        }
        consortiumMemberRepository.save(member);
        consortium.getMembers().add(member);

        return toDto(consortium);
    }

    @Transactional(readOnly = true)
    public List<ConsortiumDto> getAll() {
        return consortiumRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ConsortiumDto> getMine(String callerEmail) {
        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        return consortiumMemberRepository.findByUserId(caller.getId())
                .stream()
                .map(m -> toDto(m.getConsortium()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConsortiumDto getById(Long id) {
        Consortium consortium = consortiumRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Consortium not found"));
        return toDto(consortium);
    }

    // ── Miembros ──────────────────────────────────────────────────────────────

    @Transactional
    public InvitationDto addMember(Long consortiumId, AddMemberRequest request, String callerEmail) {
        return invitationService.inviteMember(consortiumId, request.username(), request.metrosCuadrados(), callerEmail);
    }

    @Transactional
    public InvitationDto updateInvitationMetrosCuadrados(Long consortiumId, Long invitationId,
                                                 UpdateMetrosCuadradosRequest request, String callerEmail) {
        return invitationService.updateInvitationMetrosCuadrados(consortiumId, invitationId, request.metrosCuadrados(), callerEmail);
    }

    @Transactional
    public ConsortiumDto promoteToAdmin(Long consortiumId, Long targetUserId, String callerEmail) {
        consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consortium not found"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede promover miembros");

        ConsortiumMember target = consortiumMemberRepository
                .findByConsortiumIdAndUserId(consortiumId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this consortium"));

        if (target.getRole() == ConsortiumRole.ADMIN)
            throw new IllegalArgumentException("El usuario ya es administrador");

        target.setRole(ConsortiumRole.ADMIN);
        consortiumMemberRepository.save(target);
        return toDto(consortiumRepository.findById(consortiumId).orElseThrow());
    }

    @Transactional
    public ConsortiumDto demoteFromAdmin(Long consortiumId, Long targetUserId, String callerEmail) {
        consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consortium not found"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        if (caller.getId().equals(targetUserId))
            throw new IllegalArgumentException("No podés quitarte el rol de administrador a vos mismo");

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede degradar miembros");

        ConsortiumMember target = consortiumMemberRepository
                .findByConsortiumIdAndUserId(consortiumId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this consortium"));

        if (target.getRole() != ConsortiumRole.ADMIN)
            throw new IllegalArgumentException("El usuario no es administrador");

        long adminCount = consortiumMemberRepository.findByConsortiumId(consortiumId)
                .stream().filter(m -> m.getRole() == ConsortiumRole.ADMIN).count();
        if (adminCount == 1)
            throw new IllegalArgumentException("No se puede degradar al único administrador");

        target.setRole(ConsortiumRole.MEMBER);
        consortiumMemberRepository.save(target);
        return toDto(consortiumRepository.findById(consortiumId).orElseThrow());
    }

    @Transactional
    public void removeMember(Long consortiumId, Long targetUserId, String callerEmail) {
        consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consortium not found"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        if (caller.getId().equals(targetUserId))
            throw new IllegalArgumentException("Usá DELETE /api/consortiums/{id}/members/me para salir del consorcio");

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede expulsar miembros");

        ConsortiumMember membership = consortiumMemberRepository
                .findByConsortiumIdAndUserId(consortiumId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this consortium"));

        if (membership.getBalance().compareTo(BigDecimal.ZERO) != 0)
            throw new IllegalArgumentException("El miembro tiene saldo pendiente. Saldá la deuda antes de expulsarlo");

        consortiumMemberRepository.delete(membership);
    }

    @Transactional
    public void leaveConsortium(Long consortiumId, String callerEmail) {
        consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consortium not found"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        ConsortiumMember membership = consortiumMemberRepository
                .findByConsortiumIdAndUserId(consortiumId, caller.getId())
                .orElseThrow(() -> new IllegalArgumentException("No sos miembro de este consorcio"));

        if (membership.getBalance().compareTo(BigDecimal.ZERO) != 0)
            throw new IllegalArgumentException("Tenés saldo pendiente. Saldá la deuda antes de salir");

        if (membership.getRole() == ConsortiumRole.ADMIN) {
            long adminCount = consortiumMemberRepository.findByConsortiumId(consortiumId)
                    .stream().filter(m -> m.getRole() == ConsortiumRole.ADMIN).count();
            if (adminCount == 1)
                throw new IllegalArgumentException("Sos el único administrador. Promové otro miembro antes de salir");
        }

        consortiumMemberRepository.delete(membership);
    }

    @Transactional
    public ConsortiumDto updateBankDetails(Long consortiumId, String cbu, String alias, String titular, String callerEmail) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado"));

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede modificar los datos bancarios");

        consortium.setCbu(cbu);
        consortium.setAlias(alias);
        consortium.setTitular(titular);
        consortiumRepository.save(consortium);

        return toDto(consortium);
    }

    @Transactional
    public ConsortiumDto updateName(Long consortiumId, String newName, String callerEmail) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado"));

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede cambiar el nombre del grupo");

        consortium.setName(newName);
        consortiumRepository.save(consortium);

        return toDto(consortium);
    }

    @Transactional
    public ConsortiumDto updateDiaCierre(Long consortiumId, Integer dia, String callerEmail) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado"));

        requireAdmin(consortiumId, caller.getId(), "Solo el administrador puede cambiar el día de cierre");

        consortium.setDiaCierre(dia);
        consortiumRepository.save(consortium);
        return toDto(consortium);
    }

    /**
     * Actualiza los metros cuadrados de un miembro.
     * Nota: Validación de admin se hace en controller con @PreAuthorize
     */
    @Transactional
    public ConsortiumDto updateMemberMetrosCuadrados(Long consortiumId, Long memberId,
                                             UpdateMetrosCuadradosRequest request, String callerEmail) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));

        ConsortiumMember member = consortiumMemberRepository.findByConsortiumIdAndUserId(consortiumId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("El miembro no existe en este consorcio"));

        member.setMetrosCuadrados(request.metrosCuadrados());
        consortiumMemberRepository.save(member);

        return toDto(consortium);
    }

    @Transactional
    public void deleteConsortium(Long consortiumId, String callerEmail) {
        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Consorcio no encontrado"));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado"));

        requireAdmin(consortiumId, caller.getId(),
                "Solo el administrador puede eliminar el grupo");

        invitationRepository.deleteByConsortiumId(consortiumId);
        expenseRepository.deleteByConsortiumId(consortiumId);
        fundMovementRepository.deleteByConsortiumId(consortiumId);
        consortiumRepository.delete(consortium);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void requireAdmin(Long consortiumId, Long userId, String message) {
        boolean isAdmin = consortiumMemberRepository
                .existsByConsortiumIdAndUserIdAndRole(consortiumId, userId, ConsortiumRole.ADMIN);
        if (!isAdmin) throw new ForbiddenException(message);
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = Consortium.generateCode();
        } while (consortiumRepository.findByInvitationCode(code).isPresent());
        return code;
    }

    private ConsortiumDto toDto(Consortium c) {
        List<ConsortiumMemberDto> members = c.getMembers().stream()
                .map(this::toMemberDto).toList();
        List<InvitationDto> pending = invitationRepository
                .findByConsortiumIdAndStatus(c.getId(), com.cuentasclaras.back.entity.InvitationStatus.PENDING)
                .stream()
                .map(invitationService::toInvitationDto)
                .toList();
        return new ConsortiumDto(c.getId(), c.getName(), c.getInitialBalance(), c.getCreatedAt(), members, c.getInvitationCode(), c.getCbu(), c.getAlias(), c.getTitular(), pending, c.getDiaCierre());
    }

    private ConsortiumMemberDto toMemberDto(ConsortiumMember m) {
        return new ConsortiumMemberDto(
                m.getUser().getId(),
                m.getUser().getNombre(),
                m.getUser().getEmail(),
                m.getRole().name(),
                m.getBalance(),
                m.getMetrosCuadrados(), null, null, null
        );
    }
}