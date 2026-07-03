package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "consortium_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"consortium_id", "user_id"})
)
public class ConsortiumMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consortium_id", nullable = false)
    private Consortium consortium;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConsortiumRole role;

    /**
     * Running balance for this member's individual account (Cuenta Corriente Individual).
     * Positive  → the member has a credit (paid more than owed).
     * Negative  → the member has a debt (owes money to the consortium).
     * Zero      → fully settled; the member is allowed to leave.
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal metrosCuadrados = new BigDecimal("50.00");

    // ── Gestión de Mora ────────────────────────────────────────────────────────

    /**
     * Fecha de vencimiento mensual de la cuota.
     * El scheduler evalúa diariamente si la fecha pasó con balance negativo.
     * Null → sin control de mora.
     */
    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    /**
     * AL_DIA → al corriente. EN_MORA → venció y tiene deuda.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "membership_status", nullable = false, length = 20)
    private MembershipStatus membershipStatus = MembershipStatus.AL_DIA;

    /** Fecha en que el sistema registró el inicio de la mora. */
    @Column(name = "mora_desde")
    private LocalDate moraDesdeFecha;

    /** True si el admin ya fue notificado de este período de mora. */
    @Column(name = "admin_notificado", nullable = false)
    private boolean adminNotificado = false;
    
    public ConsortiumMember() {}

    public ConsortiumMember(Consortium consortium, User user, ConsortiumRole role) {
        this.consortium = consortium;
        this.user = user;
        this.role = role;
        this.balance = BigDecimal.ZERO;
        this.joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Consortium getConsortium() { return consortium; }
    public void setConsortium(Consortium consortium) { this.consortium = consortium; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public ConsortiumRole getRole() { return role; }
    public void setRole(ConsortiumRole role) { this.role = role; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    public BigDecimal getMetrosCuadrados() { return metrosCuadrados; }
    public void setMetrosCuadrados(BigDecimal metrosCuadrados) { this.metrosCuadrados = metrosCuadrados; }

    // ── Getters/Setters de mora ───────────────────────────────────────────────

    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public MembershipStatus getMembershipStatus() { return membershipStatus; }
    public void setMembershipStatus(MembershipStatus membershipStatus) {
        this.membershipStatus = membershipStatus;
    }

    public LocalDate getMoraDesdeFecha() { return moraDesdeFecha; }
    public void setMoraDesdeFecha(LocalDate moraDesdeFecha) {
        this.moraDesdeFecha = moraDesdeFecha;
    }

    public boolean isAdminNotificado() { return adminNotificado; }
    public void setAdminNotificado(boolean adminNotificado) {
        this.adminNotificado = adminNotificado;
    }

    // ── Helpers de dominio ────────────────────────────────────────────────────

    public boolean tieneDeuda() {
        return balance.compareTo(BigDecimal.ZERO) < 0;
    }

    public boolean estaEnMora() {
        return MembershipStatus.EN_MORA.equals(membershipStatus);
    }
}