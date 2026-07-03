package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consortiums")
public class Consortium {

    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "initial_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal initialBalance;

    @Column(name = "current_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentBalance;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "invitation_code", unique = true, nullable = false, length = 6)
    private String invitationCode;

    @Column(length = 22)
    private String cbu;

    @Column(length = 50)
    private String alias;

    @Column(length = 100)
    private String titular;

    @Column(name = "dia_cierre")
    private Integer diaCierre;

    @OneToMany(mappedBy = "consortium", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConsortiumMember> members = new ArrayList<>();

    public Consortium() {}

    public Consortium(String name, BigDecimal initialBalance) {
        this.name = name;
        this.initialBalance = initialBalance;
        this.currentBalance = initialBalance;
        this.createdAt = LocalDateTime.now();
    }

    public static String generateCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return code.toString();
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getInitialBalance() { return initialBalance; }
    public void setInitialBalance(BigDecimal initialBalance) { this.initialBalance = initialBalance; }

    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getInvitationCode() { return invitationCode; }
    public void setInvitationCode(String invitationCode) { this.invitationCode = invitationCode; }

    public String getCbu() { return cbu; }
    public void setCbu(String cbu) { this.cbu = cbu; }

    public String getAlias() { return alias; }
    public void setAlias(String alias) { this.alias = alias; }

    public String getTitular() { return titular; }
    public void setTitular(String titular) { this.titular = titular; }

    public Integer getDiaCierre() { return diaCierre; }
    public void setDiaCierre(Integer diaCierre) { this.diaCierre = diaCierre; }

    public List<ConsortiumMember> getMembers() { return members; }
}