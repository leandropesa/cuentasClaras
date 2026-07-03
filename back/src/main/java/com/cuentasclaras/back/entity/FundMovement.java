package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fund_movements")
public class FundMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consortium_id", nullable = false)
    private Consortium consortium;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private FundMovementType tipo;

    @Column(nullable = false)
    private String concepto;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monto;

    /** Usuario que registró el movimiento (puede ser null si es automático). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id")
    private User registradoPor;

    @Column(name = "fecha_movimiento", nullable = false)
    private LocalDate fechaMovimiento;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public FundMovement() {}

    public FundMovement(Consortium consortium, FundMovementType tipo,
                        String concepto, BigDecimal monto,
                        User registradoPor, LocalDate fechaMovimiento) {
        this.consortium     = consortium;
        this.tipo           = tipo;
        this.concepto       = concepto;
        this.monto          = monto;
        this.registradoPor  = registradoPor;
        this.fechaMovimiento = fechaMovimiento;
        this.createdAt      = LocalDateTime.now();
    }

    public Long getId()                    { return id; }
    public Consortium getConsortium()      { return consortium; }
    public FundMovementType getTipo()      { return tipo; }
    public String getConcepto()            { return concepto; }
    public BigDecimal getMonto()           { return monto; }
    public User getRegistradoPor()         { return registradoPor; }
    public LocalDate getFechaMovimiento()  { return fechaMovimiento; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
}