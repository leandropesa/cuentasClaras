// back/src/main/java/com/cuentasclaras/back/service/FinanceService.java
package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.BalanceRowDto;
import com.cuentasclaras.back.dto.ComprobanteDto;
import com.cuentasclaras.back.dto.CreateExpenseRequest;
import com.cuentasclaras.back.dto.CreatePaymentRequest;
import com.cuentasclaras.back.dto.DashboardDto;
import com.cuentasclaras.back.dto.ExpenseDto;
import com.cuentasclaras.back.dto.GroupDto;
import com.cuentasclaras.back.dto.MemberDto;
import com.cuentasclaras.back.dto.PaymentDto;
import com.cuentasclaras.back.entity.Consortium;
import com.cuentasclaras.back.entity.ConsortiumMember;
import com.cuentasclaras.back.entity.ConsortiumRole;
import com.cuentasclaras.back.entity.Expense;
import com.cuentasclaras.back.entity.ExpenseSubType;
import com.cuentasclaras.back.entity.ExpenseType;
import com.cuentasclaras.back.entity.FundMovement;
import com.cuentasclaras.back.entity.FundMovementType;
import com.cuentasclaras.back.entity.Payment;
import com.cuentasclaras.back.entity.Period;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.exception.FondoInsuficienteException;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.ConsortiumRepository;
import com.cuentasclaras.back.repository.ExpenseRepository;
import com.cuentasclaras.back.repository.FundMovementRepository;
import com.cuentasclaras.back.repository.PaymentRepository;
import com.cuentasclaras.back.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinanceService {

    private final GroupService               groupService;
    private final ExpenseRepository          expenseRepository;
    private final ConsortiumRepository       consortiumRepository;
    private final ConsortiumMemberRepository memberRepository;
    private final UserRepository             userRepository;
    private final FundMovementRepository     fundMovementRepository;
    private final PaymentRepository          paymentRepository;
    private final ComprobanteService         comprobanteService;
    private final MoraService                moraService;
    private final PeriodService              periodService;

    public FinanceService(GroupService groupService,
                          ExpenseRepository expenseRepository,
                          ConsortiumRepository consortiumRepository,
                          ConsortiumMemberRepository memberRepository,
                          UserRepository userRepository,
                          FundMovementRepository fundMovementRepository,
                          PaymentRepository paymentRepository,
                          ComprobanteService comprobanteService,
                          MoraService moraService,
                          PeriodService periodService) {
        this.groupService           = groupService;
        this.expenseRepository      = expenseRepository;
        this.consortiumRepository   = consortiumRepository;
        this.memberRepository       = memberRepository;
        this.userRepository         = userRepository;
        this.fundMovementRepository = fundMovementRepository;
        this.paymentRepository      = paymentRepository;
        this.comprobanteService     = comprobanteService;
        this.moraService            = moraService;
        this.periodService          = periodService;
    }

    // ── Gastos ────────────────────────────────────────────────────────────────

    public List<ExpenseDto> getGastos(String grupoId) {
        Long id = parseId(grupoId);
        return expenseRepository
                .findByConsortiumIdOrderByFechaGastoDescCreatedAtDesc(id)
                .stream()
                .map(this::toExpenseDto)
                .toList();
    }

    @Transactional
    public ExpenseDto createExpense(CreateExpenseRequest req, String callerEmail) {

        Long consortiumId = parseId(req.grupoId());

        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado: " + req.grupoId()));

        ExpenseType tipoGasto;
        try {
            tipoGasto = (req.tipoGasto() == null || req.tipoGasto().isBlank())
                    ? ExpenseType.EXTRAORDINARIO
                    : ExpenseType.valueOf(req.tipoGasto().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("tipoGasto inválido. Valores: FIJO, EXTRAORDINARIO");
        }

        ExpenseSubType subTipo = null;
        if (tipoGasto == ExpenseType.EXTRAORDINARIO) {
            if (req.subTipo() == null || req.subTipo().isBlank()) {
                subTipo = ExpenseSubType.CONVENIO;
            } else {
                try {
                    subTipo = ExpenseSubType.valueOf(req.subTipo().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("subTipo inválido. Valores: CONVENIO, EN_MOMENTO");
                }
            }
        }

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (tipoGasto == ExpenseType.FIJO) {
            boolean isAdmin = memberRepository.existsByConsortiumIdAndUserIdAndRole(
                    consortiumId, caller.getId(), ConsortiumRole.ADMIN);
            if (!isAdmin) {
                throw new IllegalArgumentException(
                        "Solo el administrador del grupo puede cargar gastos fijos");
            }
        }

        // Miembros en mora no pueden cargar gastos extraordinarios por convenio
        if (tipoGasto == ExpenseType.EXTRAORDINARIO && subTipo == ExpenseSubType.CONVENIO) {
            moraService.assertNoEnMora(consortiumId, callerEmail);
        }

        LocalDate fecha = (req.fecha() == null || req.fecha().isBlank())
                ? LocalDate.now()
                : LocalDate.parse(req.fecha());

        List<ConsortiumMember> members = memberRepository.findByConsortiumId(consortiumId);
        int cantMiembros = members.isEmpty() ? 1 : members.size();

        if (tipoGasto == ExpenseType.FIJO) {
            distributeFixedExpense(members, req.monto());

        } else if (subTipo == ExpenseSubType.CONVENIO) {
            BigDecimal cuota = req.monto()
                    .divide(BigDecimal.valueOf(cantMiembros), 2, RoundingMode.HALF_UP);
            for (ConsortiumMember member : members) {
                member.setBalance(member.getBalance().subtract(cuota));
                memberRepository.save(member);
            }

        } else {
            BigDecimal saldoFondo = fundMovementRepository.calcularSaldo(consortiumId);
            if (saldoFondo.compareTo(req.monto()) < 0) {
                throw new FondoInsuficienteException(
                        "Saldo insuficiente en el fondo. " +
                        "Saldo actual: $" + saldoFondo.setScale(0, RoundingMode.HALF_UP) +
                        " — Monto del gasto: $" + req.monto().setScale(0, RoundingMode.HALF_UP)
                );
            }

            FundMovement egreso = new FundMovement(
                    consortium, FundMovementType.EGRESO,
                    req.descripcion(), req.monto(), caller, fecha
            );
            fundMovementRepository.save(egreso);

            BigDecimal cuota = req.monto()
                    .divide(BigDecimal.valueOf(cantMiembros), 2, RoundingMode.HALF_UP);
            for (ConsortiumMember member : members) {
                member.setBalance(member.getBalance().subtract(cuota));
                memberRepository.save(member);
            }
        }

        Period period = periodService.getCurrentPeriod(consortiumId);

        Expense expense = new Expense(
                consortium, req.descripcion(), req.monto(),
                req.categoria(), fecha, req.cargadoPor(),
                tipoGasto, subTipo
        );
        expense.setPeriod(period);
        expenseRepository.save(expense);

        return toExpenseDto(expense);
    }

    // ── Pagos (DB) ────────────────────────────────────────────────────────────

    public List<PaymentDto> getPagos(String grupoId) {
        groupService.getById(grupoId);
        Long consortiumId = parseId(grupoId);
        return paymentRepository
                .findByConsortiumIdOrderByFechaPagoDescCreatedAtDesc(consortiumId)
                .stream()
                .map(this::toPaymentDto)
                .toList();
    }

    @Transactional
    public PaymentDto createPayment(CreatePaymentRequest req, String callerEmail) {
        Long consortiumId = parseId(req.grupoId());

        Consortium consortium = consortiumRepository.findById(consortiumId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado: " + req.grupoId()));

        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        boolean isMember = memberRepository.existsByConsortiumIdAndUserId(consortiumId, caller.getId());
        if (!isMember) {
            throw new IllegalArgumentException("No pertenecés a este grupo");
        }

        LocalDate fecha = (req.fecha() == null || req.fecha().isBlank())
                ? LocalDate.now()
                : LocalDate.parse(req.fecha());

        Period period = periodService.getCurrentPeriod(consortiumId);

        Payment payment = new Payment(consortium, caller, req.monto(), fecha);
        payment.setPeriod(period);
        paymentRepository.save(payment);

        return toPaymentDto(payment);
    }

    // ── Dashboard / Balance ───────────────────────────────────────────────────

    public DashboardDto getDashboard(String grupoId) {
        GroupDto grupo        = groupService.getById(grupoId);
        Long consortiumId     = parseId(grupoId);

        Period currentPeriod = periodService.getCurrentPeriod(consortiumId);

        List<ExpenseDto> gastosGrupo = expenseRepository
                .findByConsortiumIdAndPeriodIdOrderByFechaGastoDescCreatedAtDesc(consortiumId, currentPeriod.getId())
                .stream().map(this::toExpenseDto).toList();

        List<PaymentDto> pagosGrupo = paymentRepository
                .findByConsortiumIdAndPeriodIdOrderByFechaPagoDescCreatedAtDesc(consortiumId, currentPeriod.getId())
                .stream().map(this::toPaymentDto).toList();

        BigDecimal totalGastos = gastosGrupo.stream()
                .map(ExpenseDto::monto).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPagos = pagosGrupo.stream()
                .map(PaymentDto::monto).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> movimientos = new ArrayList<>();
        gastosGrupo.forEach(g -> {
            Map<String, Object> m = new HashMap<>();
            m.put("tipo",        "GASTO");
            m.put("id",          g.id());
            m.put("descripcion", g.descripcion());
            m.put("monto",       g.monto());
            m.put("fecha",       g.fecha());
            m.put("usuario",     g.cargadoPor());
            m.put("tipoGasto",   g.tipoGasto());
            m.put("subTipo",     g.subTipo());
            movimientos.add(m);
        });
        pagosGrupo.forEach(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("tipo",        "PAGO");
            m.put("id",          p.id());
            m.put("descripcion", "Pago registrado");
            m.put("monto",       p.monto());
            m.put("fecha",       p.fecha());
            m.put("usuario",     p.socioNombre());
            m.put("tipoGasto",   "");
            m.put("subTipo",     "");
            movimientos.add(m);
        });
        movimientos.sort(Comparator.comparing(
                item -> item.get("fecha").toString(), Comparator.reverseOrder()));

        List<BalanceRowDto> balances = buildBalanceFromMembers(consortiumId, grupo);

        return new DashboardDto(grupo, totalGastos, totalPagos,
                grupo.miembros().size(), balances, movimientos);
    }

    public List<BalanceRowDto> getBalance(String grupoId) {
        GroupDto grupo = groupService.getById(grupoId);
        Long consortiumId = parseId(grupoId);
        return buildBalanceFromMembers(consortiumId, grupo);
    }

    // ── Interno ───────────────────────────────────────────────────────────────

    private List<BalanceRowDto> buildBalanceFromMembers(Long consortiumId, GroupDto grupo) {
        List<ConsortiumMember> members = memberRepository.findByConsortiumId(consortiumId);

        BigDecimal totalMetrosCuadrados = members.stream()
                .map(ConsortiumMember::getMetrosCuadrados)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalGastosFijo = expenseRepository
                .findByConsortiumIdOrderByFechaGastoDescCreatedAtDesc(consortiumId)
                .stream()
                .filter(e -> e.getTipoGasto().name().equals("FIJO"))
                .map(Expense::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalGastosExtraordinario = expenseRepository
                .findByConsortiumIdOrderByFechaGastoDescCreatedAtDesc(consortiumId)
                .stream()
                .filter(e -> e.getTipoGasto().name().equals("EXTRAORDINARIO"))
                .map(Expense::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return members.stream().map(member -> {
            MemberDto dto = grupo.miembros().stream()
                    .filter(m -> m.id().equals(String.valueOf(member.getUser().getId())))
                    .findFirst()
                    .orElse(null);

            String nombre = dto != null ? dto.nombre() : member.getUser().getNombre();

            BigDecimal aportado = fundMovementRepository
                    .sumByConsortiumIdUserIdAndTipo(consortiumId,
                            member.getUser().getId(), FundMovementType.INGRESO);

            BigDecimal objetivoFijo = totalMetrosCuadrados.compareTo(BigDecimal.ZERO) > 0
                    ? totalGastosFijo.multiply(member.getMetrosCuadrados()).divide(totalMetrosCuadrados, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal objetivoExtraordinario = members.isEmpty() ? BigDecimal.ZERO
                    : totalGastosExtraordinario.divide(BigDecimal.valueOf(members.size()), 2, RoundingMode.HALF_UP);

            BigDecimal objetivo = objetivoFijo.add(objetivoExtraordinario);

            return new BalanceRowDto(
                    String.valueOf(member.getUser().getId()),
                    nombre,
                    aportado,
                    BigDecimal.ZERO,
                    objetivo,
                    member.getBalance()
            );
        }).toList();
    }

    private ExpenseDto toExpenseDto(Expense e) {
        return new ExpenseDto(
                String.valueOf(e.getId()),
                String.valueOf(e.getConsortium().getId()),
                e.getDescripcion(),
                e.getMonto(),
                e.getCategoria(),
                e.getFechaGasto().toString(),
                e.getCargadoPor(),
                e.getTipoGasto().name(),
                e.getSubTipo() != null ? e.getSubTipo().name() : null
        );
    }

    private PaymentDto toPaymentDto(Payment p) {
        ComprobanteDto comprobanteDto = p.getComprobante() != null
                ? comprobanteService.toDto(p.getComprobante())
                : null;
        return new PaymentDto(
                String.valueOf(p.getId()),
                String.valueOf(p.getConsortium().getId()),
                String.valueOf(p.getUser().getId()),
                p.getUser().getNombre(),
                p.getMonto(),
                p.getFechaPago().toString(),
                comprobanteDto
        );
    }

    private Long parseId(String id) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("ID de grupo inválido: " + id);
        }
    }

    private void distributeFixedExpense(List<ConsortiumMember> members, BigDecimal monto) {
        if (members.isEmpty()) return;

        BigDecimal totalMetrosCuadrados = members.stream()
                .map(ConsortiumMember::getMetrosCuadrados)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (ConsortiumMember member : members) {
            BigDecimal cuota = monto
                    .multiply(member.getMetrosCuadrados())
                    .divide(totalMetrosCuadrados, 2, RoundingMode.HALF_UP);
            member.setBalance(member.getBalance().subtract(cuota));
            memberRepository.save(member);
        }
    }
}
