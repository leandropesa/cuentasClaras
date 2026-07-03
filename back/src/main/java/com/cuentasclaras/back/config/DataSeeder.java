package com.cuentasclaras.back.config;

import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(
            UserRepository userRepository,
            ConsortiumRepository consortiumRepository,
            ConsortiumMemberRepository consortiumMemberRepository,
            ExpenseRepository expenseRepository,
            FundMovementRepository fundMovementRepository,
            InvitationRepository invitationRepository,
            PaymentRepository paymentRepository,
            PeriodRepository periodRepository,
            PeriodMemberSnapshotRepository snapshotRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            if (userRepository.existsByEmail("admin@cuentasclaras.com")) {
                System.out.println("[DataSeeder] Datos ya existen. Saltando seed.");
                return;
            }

            // ── 1. Usuarios ───────────────────────────────────────────────────
            User admin  = userRepository.save(new User(
                    "Admin Consorcio", "admin@cuentasclaras.com",
                    passwordEncoder.encode("admin123")));
            User carlos = userRepository.save(new User(
                    "Carlos García", "carlos@cuentasclaras.com",
                    passwordEncoder.encode("carlos123")));
            User maria  = userRepository.save(new User(
                    "María López", "maria@cuentasclaras.com",
                    passwordEncoder.encode("maria123")));

            // ── 2. Consorcio ──────────────────────────────────────────────────
            Consortium consorcio = new Consortium("Edificio Las Acacias", new BigDecimal("50000.00"));
            consorcio.setInvitationCode(Consortium.generateCode());
            consortiumRepository.save(consorcio);

            // ── 3. Membresías ─────────────────────────────────────────────────
            ConsortiumMember memberAdmin  = consortiumMemberRepository.save(
                    new ConsortiumMember(consorcio, admin,  ConsortiumRole.ADMIN));
            ConsortiumMember memberCarlos = consortiumMemberRepository.save(
                    new ConsortiumMember(consorcio, carlos, ConsortiumRole.MEMBER));
            ConsortiumMember memberMaria  = consortiumMemberRepository.save(
                    new ConsortiumMember(consorcio, maria,  ConsortiumRole.MEMBER));

            // ── 4. Invitaciones aceptadas ──────────────────────────────────────
            for (User u : new User[]{admin, carlos, maria}) {
                Invitation inv = new Invitation(consorcio, u.getEmail(), UUID.randomUUID().toString());
                inv.setStatus(InvitationStatus.ACCEPTED);
                inv.setAcceptedAt(LocalDateTime.now());
                invitationRepository.save(inv);
            }

            // ── 5. Fondo inicial ───────────────────────────────────────────────
            fundMovementRepository.save(new FundMovement(
                    consorcio, FundMovementType.INGRESO,
                    "Saldo inicial del fondo",
                    new BigDecimal("50000.00"), admin, LocalDate.of(2026, 4, 1)));

            // ══════════════════════════════════════════════════════════════════
            // PERÍODO ABRIL 2026 (CERRADO)
            // ══════════════════════════════════════════════════════════════════
            Period periodAbril = new Period(consorcio, 4, 2026, new BigDecimal("50000.00"));
            periodAbril.setFechaApertura(LocalDate.of(2026, 4, 1));
            periodRepository.save(periodAbril);

            BigDecimal aExpensas = new BigDecimal("18000.00");
            BigDecimal aSueldo   = new BigDecimal("9500.00");
            BigDecimal aElectr   = new BigDecimal("4200.00");
            BigDecimal aPlomero  = new BigDecimal("7800.00");
            BigDecimal aLimpieza = new BigDecimal("3500.00");
            BigDecimal aTotalAbril = aExpensas.add(aSueldo).add(aElectr).add(aPlomero).add(aLimpieza); // 43000
            BigDecimal aCuota = aTotalAbril.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);     // 14333.33

            saveExpense(expenseRepository, consorcio, periodAbril,
                    "Expensas Abril 2026", aExpensas, "EXPENSAS",
                    LocalDate.of(2026, 4, 1), admin, ExpenseType.FIJO, null);
            saveExpense(expenseRepository, consorcio, periodAbril,
                    "Sueldo encargado - Abril", aSueldo, "PERSONAL",
                    LocalDate.of(2026, 4, 1), admin, ExpenseType.FIJO, null);
            saveExpense(expenseRepository, consorcio, periodAbril,
                    "Electricista - Luz pasillos", aElectr, "REPARACIONES",
                    LocalDate.of(2026, 4, 8), carlos, ExpenseType.EXTRAORDINARIO, ExpenseSubType.CONVENIO);
            saveExpense(expenseRepository, consorcio, periodAbril,
                    "Plomero - Caño roto PB", aPlomero, "REPARACIONES",
                    LocalDate.of(2026, 4, 10), maria, ExpenseType.EXTRAORDINARIO, ExpenseSubType.EN_MOMENTO);
            saveExpense(expenseRepository, consorcio, periodAbril,
                    "Limpieza profunda hall", aLimpieza, "LIMPIEZA",
                    LocalDate.of(2026, 4, 12), carlos, ExpenseType.EXTRAORDINARIO, ExpenseSubType.CONVENIO);

            BigDecimal aPagoAdmin = new BigDecimal("18000.00");
            BigDecimal aPagoCuota = aCuota; // María paga exacto

            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Abril — Admin Consorcio", aPagoAdmin, admin, LocalDate.of(2026, 4, 3)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Abril — María López", aPagoCuota, maria, LocalDate.of(2026, 4, 5)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.EGRESO,
                    "Plomero - Caño roto PB (pago inmediato)", aPlomero, admin, LocalDate.of(2026, 4, 10)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.EGRESO,
                    "Sueldo encargado - pago Abril", aSueldo, admin, LocalDate.of(2026, 4, 10)));

            savePayment(paymentRepository, consorcio, periodAbril, admin,  new BigDecimal("10000.00"), LocalDate.of(2026, 4, 5));
            savePayment(paymentRepository, consorcio, periodAbril, carlos, new BigDecimal("5000.00"),  LocalDate.of(2026, 4, 7));
            savePayment(paymentRepository, consorcio, periodAbril, maria,  new BigDecimal("8000.00"),  LocalDate.of(2026, 4, 10));
            savePayment(paymentRepository, consorcio, periodAbril, admin,  new BigDecimal("7000.00"),  LocalDate.of(2026, 4, 15));

            // Balances al cierre de Abril
            BigDecimal aBalAdmin  = aPagoAdmin.subtract(aCuota);          // +3666.67
            BigDecimal aBalCarlos = BigDecimal.ZERO.subtract(aCuota);     // -14333.33
            BigDecimal aBalMaria  = BigDecimal.ZERO;                       // 0

            // Saldo fondo Abril = 50000 + 18000 + 14333.33 - 7800 - 9500
            BigDecimal aFondoFinal = new BigDecimal("50000.00")
                    .add(aPagoAdmin).add(aPagoCuota).subtract(aPlomero).subtract(aSueldo);

            periodAbril.setEstado(PeriodStatus.CERRADO);
            periodAbril.setFechaCierre(LocalDate.of(2026, 4, 30));
            periodAbril.setSaldoFinalFondo(aFondoFinal);
            periodRepository.save(periodAbril);

            snapshotRepository.save(new PeriodMemberSnapshot(periodAbril, admin.getId(),  admin.getNombre(),  aBalAdmin));
            snapshotRepository.save(new PeriodMemberSnapshot(periodAbril, carlos.getId(), carlos.getNombre(), aBalCarlos));
            snapshotRepository.save(new PeriodMemberSnapshot(periodAbril, maria.getId(),  maria.getNombre(),  aBalMaria));

            // ══════════════════════════════════════════════════════════════════
            // PERÍODO MAYO 2026 (CERRADO)
            // ══════════════════════════════════════════════════════════════════
            Period periodMayo = new Period(consorcio, 5, 2026, aFondoFinal);
            periodMayo.setFechaApertura(LocalDate.of(2026, 5, 1));
            periodRepository.save(periodMayo);

            BigDecimal mExpensas = new BigDecimal("18000.00");
            BigDecimal mSueldo   = new BigDecimal("9500.00");
            BigDecimal mGas      = new BigDecimal("2800.00");
            BigDecimal mTotalMayo = mExpensas.add(mSueldo).add(mGas); // 30300
            BigDecimal mCuota = mTotalMayo.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP); // 10100

            saveExpense(expenseRepository, consorcio, periodMayo,
                    "Expensas Mayo 2026", mExpensas, "EXPENSAS",
                    LocalDate.of(2026, 5, 1), admin, ExpenseType.FIJO, null);
            saveExpense(expenseRepository, consorcio, periodMayo,
                    "Sueldo encargado - Mayo", mSueldo, "PERSONAL",
                    LocalDate.of(2026, 5, 1), admin, ExpenseType.FIJO, null);
            saveExpense(expenseRepository, consorcio, periodMayo,
                    "Gas natural - Mayo", mGas, "SERVICIOS",
                    LocalDate.of(2026, 5, 15), admin, ExpenseType.EXTRAORDINARIO, ExpenseSubType.CONVENIO);

            BigDecimal mPagoAdmin  = new BigDecimal("12000.00");
            BigDecimal mPagoCarlos = new BigDecimal("8000.00");
            BigDecimal mPagoMaria  = mCuota; // María paga exacto

            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Mayo — Admin Consorcio", mPagoAdmin, admin, LocalDate.of(2026, 5, 3)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Mayo — Carlos García", mPagoCarlos, carlos, LocalDate.of(2026, 5, 10)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Mayo — María López", mPagoMaria, maria, LocalDate.of(2026, 5, 5)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.EGRESO,
                    "Sueldo encargado - pago Mayo", mSueldo, admin, LocalDate.of(2026, 5, 10)));

            savePayment(paymentRepository, consorcio, periodMayo, admin,  mPagoAdmin,  LocalDate.of(2026, 5, 3));
            savePayment(paymentRepository, consorcio, periodMayo, carlos, mPagoCarlos, LocalDate.of(2026, 5, 10));
            savePayment(paymentRepository, consorcio, periodMayo, maria,  mPagoMaria,  LocalDate.of(2026, 5, 5));

            // Balances acumulados al cierre de Mayo
            BigDecimal mBalAdmin  = aBalAdmin.add(mPagoAdmin).subtract(mCuota);    // +5566.67
            BigDecimal mBalCarlos = aBalCarlos.add(mPagoCarlos).subtract(mCuota);  // -16433.33
            BigDecimal mBalMaria  = aBalMaria.add(mPagoMaria).subtract(mCuota);    // 0

            // Saldo fondo Mayo = aFondoFinal + 12000 + 8000 + 10100 - 9500
            BigDecimal mFondoFinal = aFondoFinal.add(mPagoAdmin).add(mPagoCarlos).add(mPagoMaria).subtract(mSueldo);

            periodMayo.setEstado(PeriodStatus.CERRADO);
            periodMayo.setFechaCierre(LocalDate.of(2026, 5, 31));
            periodMayo.setSaldoFinalFondo(mFondoFinal);
            periodRepository.save(periodMayo);

            snapshotRepository.save(new PeriodMemberSnapshot(periodMayo, admin.getId(),  admin.getNombre(),  mBalAdmin));
            snapshotRepository.save(new PeriodMemberSnapshot(periodMayo, carlos.getId(), carlos.getNombre(), mBalCarlos));
            snapshotRepository.save(new PeriodMemberSnapshot(periodMayo, maria.getId(),  maria.getNombre(),  mBalMaria));

            // ══════════════════════════════════════════════════════════════════
            // PERÍODO JUNIO 2026 (ABIERTO — mes en curso)
            // ══════════════════════════════════════════════════════════════════
            Period periodJunio = new Period(consorcio, 6, 2026, mFondoFinal);
            periodJunio.setFechaApertura(LocalDate.of(2026, 6, 1));
            periodRepository.save(periodJunio);

            BigDecimal jExpensas = new BigDecimal("18000.00");
            BigDecimal jSueldo   = new BigDecimal("9500.00");
            BigDecimal jPintura  = new BigDecimal("5000.00");
            BigDecimal jTotalJunio = jExpensas.add(jSueldo).add(jPintura); // 32500
            BigDecimal jCuota = jTotalJunio.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP); // 10833.33

            saveExpense(expenseRepository, consorcio, periodJunio,
                    "Expensas Junio 2026", jExpensas, "EXPENSAS",
                    LocalDate.of(2026, 6, 1), admin, ExpenseType.FIJO, null);
            saveExpense(expenseRepository, consorcio, periodJunio,
                    "Sueldo encargado - Junio", jSueldo, "PERSONAL",
                    LocalDate.of(2026, 6, 1), admin, ExpenseType.FIJO, null);
            saveExpense(expenseRepository, consorcio, periodJunio,
                    "Pintura escalera principal", jPintura, "REPARACIONES",
                    LocalDate.of(2026, 6, 5), admin, ExpenseType.EXTRAORDINARIO, ExpenseSubType.CONVENIO);

            BigDecimal jPagoAdmin = new BigDecimal("10000.00");
            BigDecimal jPagoMaria = new BigDecimal("9000.00");

            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Junio — Admin Consorcio", jPagoAdmin, admin, LocalDate.of(2026, 6, 2)));
            fundMovementRepository.save(new FundMovement(consorcio, FundMovementType.INGRESO,
                    "Pago expensa Junio — María López", jPagoMaria, maria, LocalDate.of(2026, 6, 8)));

            savePayment(paymentRepository, consorcio, periodJunio, admin,  jPagoAdmin, LocalDate.of(2026, 6, 2));
            savePayment(paymentRepository, consorcio, periodJunio, maria,  jPagoMaria, LocalDate.of(2026, 6, 8));

            // ── Balances finales de miembros (acumulado al día de hoy) ─────────
            BigDecimal finalBalAdmin  = mBalAdmin.add(jPagoAdmin).subtract(jCuota);   // ~+4733.34
            BigDecimal finalBalCarlos = mBalCarlos.subtract(jCuota);                   // ~-27266.66
            BigDecimal finalBalMaria  = mBalMaria.add(jPagoMaria).subtract(jCuota);   // ~-1833.33

            memberAdmin.setBalance(finalBalAdmin);
            memberCarlos.setBalance(finalBalCarlos);
            memberMaria.setBalance(finalBalMaria);
            consortiumMemberRepository.save(memberAdmin);
            consortiumMemberRepository.save(memberCarlos);
            consortiumMemberRepository.save(memberMaria);

            System.out.println("[DataSeeder] ✅ Seed completado — 3 períodos.");
            System.out.printf("  → ABRIL  (CERRADO): $%s gastos, cuota $%s%n", aTotalAbril, aCuota);
            System.out.printf("  → MAYO   (CERRADO): $%s gastos, cuota $%s%n", mTotalMayo, mCuota);
            System.out.printf("  → JUNIO  (ABIERTO): $%s gastos (en curso)%n", jTotalJunio);
            System.out.printf("  → Balances: Admin=%s  Carlos=%s  María=%s%n",
                    finalBalAdmin, finalBalCarlos, finalBalMaria);
        };
    }

    private void saveExpense(ExpenseRepository repo, Consortium c, Period period,
                             String desc, BigDecimal monto, String cat,
                             LocalDate fecha, User user, ExpenseType tipo, ExpenseSubType subTipo) {
        Expense e = new Expense(c, desc, monto, cat, fecha, String.valueOf(user.getId()), tipo, subTipo);
        e.setPeriod(period);
        repo.save(e);
    }

    private void savePayment(PaymentRepository repo, Consortium c, Period period,
                             User user, BigDecimal monto, LocalDate fecha) {
        Payment p = new Payment(c, user, monto, fecha);
        p.setPeriod(period);
        repo.save(p);
    }
}
