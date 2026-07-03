package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "family_home_expenses")
public class FamilyHomeExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_home_id", nullable = false)
    private FamilyHome familyHome;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(name = "fecha_gasto", nullable = false)
    private LocalDate fechaGasto;

    @Column(name = "cargado_por", nullable = false)
    private String cargadoPor;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public FamilyHomeExpense() {}

    public FamilyHomeExpense(FamilyHome familyHome, String descripcion,
                             BigDecimal monto, String categoria,
                             LocalDate fechaGasto, String cargadoPor) {
        this.familyHome  = familyHome;
        this.descripcion = descripcion;
        this.monto       = monto;
        this.categoria   = categoria;
        this.fechaGasto  = fechaGasto;
        this.cargadoPor  = cargadoPor;
        this.createdAt   = LocalDateTime.now();
    }

    public Long getId()                 { return id; }
    public FamilyHome getFamilyHome()   { return familyHome; }
    public String getDescripcion()      { return descripcion; }
    public BigDecimal getMonto()        { return monto; }
    public String getCategoria()        { return categoria; }
    public LocalDate getFechaGasto()    { return fechaGasto; }
    public String getCargadoPor()       { return cargadoPor; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}