package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "periods")
public class Period {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consortium_id", nullable = false)
    private Consortium consortium;

    @Column(nullable = false)
    private int mes;

    @Column(nullable = false)
    private int anio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PeriodStatus estado = PeriodStatus.ABIERTO;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDate fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDate fechaCierre;

    @Column(name = "saldo_inicial_fondo", nullable = false, precision = 15, scale = 2)
    private BigDecimal saldoInicialFondo = BigDecimal.ZERO;

    @Column(name = "saldo_final_fondo", precision = 15, scale = 2)
    private BigDecimal saldoFinalFondo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Period() {}

    public Period(Consortium consortium, int mes, int anio, BigDecimal saldoInicialFondo) {
        this.consortium       = consortium;
        this.mes              = mes;
        this.anio             = anio;
        this.estado           = PeriodStatus.ABIERTO;
        this.fechaApertura    = LocalDate.now();
        this.saldoInicialFondo = saldoInicialFondo;
        this.createdAt        = LocalDateTime.now();
    }

    public Long getId()                          { return id; }
    public Consortium getConsortium()            { return consortium; }
    public int getMes()                          { return mes; }
    public int getAnio()                         { return anio; }
    public PeriodStatus getEstado()              { return estado; }
    public void setEstado(PeriodStatus estado)   { this.estado = estado; }
    public LocalDate getFechaApertura()          { return fechaApertura; }
    public void setFechaApertura(LocalDate d)    { this.fechaApertura = d; }
    public LocalDate getFechaCierre()            { return fechaCierre; }
    public void setFechaCierre(LocalDate d)      { this.fechaCierre = d; }
    public BigDecimal getSaldoInicialFondo()     { return saldoInicialFondo; }
    public BigDecimal getSaldoFinalFondo()       { return saldoFinalFondo; }
    public void setSaldoFinalFondo(BigDecimal v) { this.saldoFinalFondo = v; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
}
