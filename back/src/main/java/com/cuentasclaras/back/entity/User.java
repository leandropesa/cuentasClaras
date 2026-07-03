package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// TODO: agregar relación con grupos mediante tabla intermedia user_grupos
// user_grupos(user_id, grupo_id, rol) → roles: ADMIN, MEMBER
// Reemplazaría MemberDto por referencias reales a User

@Entity                          // "esta clase es una tabla"
@Table(name = "users")           // nombre de la tabla en postgres
public class User {

    @Id                          // esta es la clave primaria
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // autoincremental (1, 2, 3...)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)   // no pueden existir dos iguales
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<RefreshToken> refreshTokens = new java.util.ArrayList<>();

    // Constructor vacío — JPA lo necesita obligatoriamente
    public User() {}

    // Constructor completo (sin id ni createdAt, esos los maneja Java/DB)
    public User(String nombre, String email, String password) {
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.createdAt = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

}