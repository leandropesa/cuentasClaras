package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "period_member_snapshots")
public class PeriodMemberSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "period_id", nullable = false)
    private Period period;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "nombre_miembro", nullable = false)
    private String nombreMiembro;

    @Column(name = "balance_al_cierre", nullable = false, precision = 15, scale = 2)
    private BigDecimal balanceAlCierre;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public PeriodMemberSnapshot() {}

    public PeriodMemberSnapshot(Period period, Long userId, String nombreMiembro, BigDecimal balanceAlCierre) {
        this.period          = period;
        this.userId          = userId;
        this.nombreMiembro   = nombreMiembro;
        this.balanceAlCierre = balanceAlCierre;
        this.createdAt       = LocalDateTime.now();
    }

    public Long getId()                  { return id; }
    public Period getPeriod()            { return period; }
    public Long getUserId()              { return userId; }
    public String getNombreMiembro()     { return nombreMiembro; }
    public BigDecimal getBalanceAlCierre() { return balanceAlCierre; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
}
