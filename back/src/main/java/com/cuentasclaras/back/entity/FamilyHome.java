package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "family_homes")
public class FamilyHome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "invitation_code", nullable = false, unique = true, length = 8)
    private String invitationCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "familyHome", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FamilyHomeMember> members = new ArrayList<>();

    public FamilyHome() {}

    public FamilyHome(String name) {
        this.name           = name;
        this.invitationCode = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        this.createdAt      = LocalDateTime.now();
    }

    public Long getId()                          { return id; }
    public String getName()                      { return name; }
    public void setName(String name)             { this.name = name; }
    public String getInvitationCode()            { return invitationCode; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public List<FamilyHomeMember> getMembers()   { return members; }
}