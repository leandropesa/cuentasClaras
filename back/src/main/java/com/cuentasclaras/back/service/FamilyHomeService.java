package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.*;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.exception.ForbiddenException;
import com.cuentasclaras.back.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class FamilyHomeService {

    private final FamilyHomeRepository        familyHomeRepository;
    private final FamilyHomeMemberRepository  memberRepository;
    private final FamilyHomeExpenseRepository expenseRepository;
    private final UserRepository              userRepository;
    private final MetrosCuadradosDistributionService   distributionService;

    public FamilyHomeService(FamilyHomeRepository familyHomeRepository,
                             FamilyHomeMemberRepository memberRepository,
                             FamilyHomeExpenseRepository expenseRepository,
                             UserRepository userRepository,
                             MetrosCuadradosDistributionService distributionService) {
        this.familyHomeRepository = familyHomeRepository;
        this.memberRepository     = memberRepository;
        this.expenseRepository    = expenseRepository;
        this.userRepository       = userRepository;
        this.distributionService  = distributionService;
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public FamilyHomeDto create(CreateFamilyHomeRequest request, String callerEmail) {
        User admin = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        FamilyHome home = new FamilyHome(request.name());
        familyHomeRepository.save(home);

        FamilyHomeMember adminMember = new FamilyHomeMember(home, admin, ConsortiumRole.ADMIN);
        memberRepository.save(adminMember);
        home.getMembers().add(adminMember);

        return toDto(home);
    }

    @Transactional(readOnly = true)
    public FamilyHomeDto getById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<FamilyHomeDto> getMine(String callerEmail) {
        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return memberRepository.findByUserId(caller.getId())
                .stream()
                .map(m -> toDto(m.getFamilyHome()))
                .toList();
    }

    // ── Miembros ──────────────────────────────────────────────────────────────

    @Transactional
    public FamilyHomeDto addMember(Long homeId, AddMemberRequest request, String callerEmail) {
        FamilyHome home = findOrThrow(homeId);
        User caller     = findUserOrThrow(callerEmail);

        requireAdmin(homeId, caller.getId(), "Solo el administrador puede agregar miembros");

        User target = userRepository.findByEmail(request.username())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (memberRepository.findByFamilyHomeIdAndUserId(homeId, target.getId()).isPresent())
            throw new IllegalArgumentException("El usuario ya es miembro de esta casa");

        FamilyHomeMember newMember = new FamilyHomeMember(home, target, ConsortiumRole.MEMBER);
        memberRepository.save(newMember);
        home.getMembers().add(newMember);

        return toDto(home);
    }

    @Transactional
    public void removeMember(Long homeId, Long targetUserId, String callerEmail) {
        findOrThrow(homeId);
        User caller = findUserOrThrow(callerEmail);

        if (caller.getId().equals(targetUserId))
            throw new IllegalArgumentException("Usá DELETE /api/family-homes/{id}/members/me para salir");

        requireAdmin(homeId, caller.getId(), "Solo el administrador puede expulsar miembros");

        FamilyHomeMember membership = memberRepository
                .findByFamilyHomeIdAndUserId(homeId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("El miembro no existe en esta casa"));

        memberRepository.delete(membership);
    }

    @Transactional
    public void leave(Long homeId, String callerEmail) {
        findOrThrow(homeId);
        User caller = findUserOrThrow(callerEmail);

        FamilyHomeMember membership = memberRepository
                .findByFamilyHomeIdAndUserId(homeId, caller.getId())
                .orElseThrow(() -> new IllegalArgumentException("No sos miembro de esta casa"));

        if (membership.getBalance().compareTo(BigDecimal.ZERO) != 0)
            throw new IllegalArgumentException("Tenés saldo pendiente. Saldá la deuda antes de salir");

        if (membership.getRole() == ConsortiumRole.ADMIN) {
            long adminCount = memberRepository.findByFamilyHomeId(homeId)
                    .stream().filter(m -> m.getRole() == ConsortiumRole.ADMIN).count();
            if (adminCount == 1)
                throw new IllegalArgumentException("Sos el único administrador. Promové otro miembro antes de salir");
        }

        memberRepository.delete(membership);
    }

    // ── Nombre ────────────────────────────────────────────────────────────────

    @Transactional
    public FamilyHomeDto updateName(Long homeId, String name, String callerEmail) {
        FamilyHome home = findOrThrow(homeId);
        User caller     = findUserOrThrow(callerEmail);

        requireAdmin(homeId, caller.getId(), "Solo el administrador puede cambiar el nombre");

        home.setName(name);
        familyHomeRepository.save(home);

        return toDto(home);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    @Transactional
    public FamilyHomeDto updateMemberRole(Long homeId, Long targetUserId,
                                          String newRole, String callerEmail) {
        findOrThrow(homeId);
        User caller = findUserOrThrow(callerEmail);

        requireAdmin(homeId, caller.getId(), "Solo el administrador puede cambiar roles");

        if (caller.getId().equals(targetUserId))
            throw new IllegalArgumentException("No podés cambiar tu propio rol");

        FamilyHomeMember member = memberRepository
                .findByFamilyHomeIdAndUserId(homeId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("El miembro no existe en esta casa"));

        ConsortiumRole role = ConsortiumRole.valueOf(newRole.toUpperCase());
        member.setRole(role);
        memberRepository.save(member);

        return toDto(findOrThrow(homeId));
    }

    // ── Gastos ────────────────────────────────────────────────────────────────

    @Transactional
    public FamilyHomeExpenseDto createExpense(CreateFamilyHomeExpenseRequest req, String callerEmail) {
        FamilyHome home = findOrThrow(req.familyHomeId());

        // Cualquier miembro puede cargar un gasto — solo verificamos que sea miembro
        User caller = findUserOrThrow(callerEmail);
        memberRepository.findByFamilyHomeIdAndUserId(req.familyHomeId(), caller.getId())
                .orElseThrow(() -> new IllegalArgumentException("No sos miembro de esta casa"));

        LocalDate fecha = (req.fecha() == null || req.fecha().isBlank())
                ? LocalDate.now()
                : LocalDate.parse(req.fecha());

        // Distribuir el gasto entre todos los miembros según sus metros cuadrados
        List<FamilyHomeMember> members = memberRepository.findByFamilyHomeId(req.familyHomeId());
        distributionService.distribute(members, req.monto());

        // Acreditar al que pagó el monto completo (adelantó el gasto por todos)
        members.stream()
                .filter(m -> m.getUser().getId().equals(caller.getId()))
                .findFirst()
                .ifPresent(payer -> {
                    payer.setBalance(payer.getBalance().add(req.monto()));
                    memberRepository.save(payer);
                });

        FamilyHomeExpense expense = new FamilyHomeExpense(
                home, req.descripcion(), req.monto(),
                req.categoria(), fecha, req.cargadoPor()
        );
        expenseRepository.save(expense);

        return toExpenseDto(expense);
    }

    @Transactional(readOnly = true)
    public List<FamilyHomeExpenseDto> getExpenses(Long homeId) {
        findOrThrow(homeId);
        return expenseRepository
                .findByFamilyHomeIdOrderByFechaGastoDescCreatedAtDesc(homeId)
                .stream()
                .map(this::toExpenseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FamilyHomeMemberDto> getBalance(Long homeId) {
        findOrThrow(homeId);
        return memberRepository.findByFamilyHomeId(homeId)
                .stream()
                .map(this::toMemberDto)
                .toList();
    }

    // ── Pagos ─────────────────────────────────────────────────────────────────

    /**
     * Registra un pago del miembro. Incrementa su balance y redistribuye el monto
     * proporcionalmente entre los acreedores (miembros con balance positivo),
     * manteniendo la propiedad de suma cero del grupo.
     */
    @Transactional
    public FamilyHomeDto pay(Long homeId, BigDecimal monto, String callerEmail) {
        findOrThrow(homeId);
        User caller = findUserOrThrow(callerEmail);

        List<FamilyHomeMember> allMembers = memberRepository.findByFamilyHomeId(homeId);

        FamilyHomeMember payer = allMembers.stream()
                .filter(m -> m.getUser().getId().equals(caller.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No sos miembro de esta casa"));

        payer.setBalance(payer.getBalance().add(monto));
        memberRepository.save(payer);

        // Redistribuir el pago entre los acreedores proporcionalmente
        List<FamilyHomeMember> creditors = allMembers.stream()
                .filter(m -> !m.getUser().getId().equals(caller.getId()))
                .filter(m -> m.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        BigDecimal totalCredit = creditors.stream()
                .map(FamilyHomeMember::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCredit.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal distributed = BigDecimal.ZERO;
            for (int i = 0; i < creditors.size(); i++) {
                FamilyHomeMember creditor = creditors.get(i);
                BigDecimal reduction;
                if (i == creditors.size() - 1) {
                    reduction = monto.subtract(distributed);
                } else {
                    reduction = monto.multiply(creditor.getBalance())
                            .divide(totalCredit, 2, RoundingMode.HALF_UP);
                }
                creditor.setBalance(creditor.getBalance().subtract(reduction));
                memberRepository.save(creditor);
                distributed = distributed.add(reduction);
            }
        }

        return toDto(findOrThrow(homeId));
    }

    // ── Join by code ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FamilyHomeDto getByCode(String code) {
        return toDto(familyHomeRepository.findByInvitationCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("No se encontró ninguna casa familiar con ese código")));
    }

    @Transactional
    public FamilyHomeDto joinByCode(String code, String callerEmail) {
        FamilyHome home = familyHomeRepository.findByInvitationCode(code.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Código de invitación inválido"));

        User caller = findUserOrThrow(callerEmail);

        if (memberRepository.findByFamilyHomeIdAndUserId(home.getId(), caller.getId()).isPresent())
            throw new IllegalArgumentException("Ya sos miembro de esta casa familiar");

        FamilyHomeMember newMember = new FamilyHomeMember(home, caller, ConsortiumRole.MEMBER);
        memberRepository.save(newMember);
        home.getMembers().add(newMember);

        return toDto(home);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FamilyHome findOrThrow(Long id) {
        return familyHomeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Casa familiar no encontrada: " + id));
    }

    private User findUserOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private void requireAdmin(Long homeId, Long userId, String message) {
        if (!memberRepository.existsByFamilyHomeIdAndUserIdAndRole(homeId, userId, ConsortiumRole.ADMIN))
            throw new ForbiddenException(message);
    }

    private FamilyHomeDto toDto(FamilyHome h) {
        return new FamilyHomeDto(
                h.getId(),
                h.getName(),
                h.getCreatedAt(),
                h.getInvitationCode(),
                h.getMembers().stream().map(this::toMemberDto).toList()
        );
    }

    private FamilyHomeMemberDto toMemberDto(FamilyHomeMember m) {
        return new FamilyHomeMemberDto(
                m.getUser().getId(),
                m.getUser().getNombre(),
                m.getUser().getEmail(),
                m.getRole().name(),
                m.getBalance()
        );
    }

    private FamilyHomeExpenseDto toExpenseDto(FamilyHomeExpense e) {
        return new FamilyHomeExpenseDto(
                e.getId(),
                e.getFamilyHome().getId(),
                e.getDescripcion(),
                e.getMonto(),
                e.getCategoria(),
                e.getFechaGasto().toString(),
                e.getCargadoPor()
        );
    }
}