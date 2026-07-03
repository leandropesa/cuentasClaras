package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "family_home_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"family_home_id", "user_id"})
)
public class FamilyHomeMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_home_id", nullable = false)
    private FamilyHome familyHome;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Reutilizamos el enum existente — ADMIN y MEMBER tienen el mismo significado
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConsortiumRole role;

    /**
     * Saldo corriente del miembro.
     * Negativo → debe plata. Positivo → tiene crédito.
     */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    public FamilyHomeMember() {}

    public FamilyHomeMember(FamilyHome familyHome, User user, ConsortiumRole role) {
        this.familyHome = familyHome;
        this.user       = user;
        this.role       = role;
        this.balance    = BigDecimal.ZERO;
        this.joinedAt   = LocalDateTime.now();
    }

    public Long getId()                          { return id; }
    public FamilyHome getFamilyHome()            { return familyHome; }
    public User getUser()                        { return user; }
    public ConsortiumRole getRole()              { return role; }
    public void setRole(ConsortiumRole role)     { this.role = role; }
    public BigDecimal getBalance()               { return balance; }
    public void setBalance(BigDecimal balance)   { this.balance = balance; }
    public LocalDateTime getJoinedAt()           { return joinedAt; }
}