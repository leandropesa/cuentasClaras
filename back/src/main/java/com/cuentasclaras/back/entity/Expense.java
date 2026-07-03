// back/src/main/java/com/cuentasclaras/back/entity/Expense.java
package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consortium_id", nullable = false)
    private Consortium consortium;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_gasto", nullable = false, length = 20)
    private ExpenseType tipoGasto;

    /**
     * Solo relevante cuando tipoGasto = EXTRAORDINARIO.
     * CONVENIO  → va a la próxima expensa, no toca el fondo.
     * EN_MOMENTO → se paga del fondo ahora.
     * Para gastos FIJOS este campo es null.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "sub_tipo", length = 20)
    private ExpenseSubType subTipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id")
    private Period period;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Expense() {}

    public Expense(Consortium consortium, String descripcion, BigDecimal monto,
                   String categoria, LocalDate fechaGasto, String cargadoPor,
                   ExpenseType tipoGasto, ExpenseSubType subTipo) {
        this.consortium  = consortium;
        this.descripcion = descripcion;
        this.monto       = monto;
        this.categoria   = categoria;
        this.fechaGasto  = fechaGasto;
        this.cargadoPor  = cargadoPor;
        this.tipoGasto   = tipoGasto;
        this.subTipo     = subTipo;
        this.createdAt   = LocalDateTime.now();
    }

    public Long getId()                  { return id; }
    public Consortium getConsortium()    { return consortium; }
    public Period getPeriod()            { return period; }
    public void setPeriod(Period period) { this.period = period; }
    public String getDescripcion()       { return descripcion; }
    public BigDecimal getMonto()         { return monto; }
    public String getCategoria()         { return categoria; }
    public LocalDate getFechaGasto()     { return fechaGasto; }
    public String getCargadoPor()        { return cargadoPor; }
    public ExpenseType getTipoGasto()    { return tipoGasto; }
    public ExpenseSubType getSubTipo()   { return subTipo; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
}