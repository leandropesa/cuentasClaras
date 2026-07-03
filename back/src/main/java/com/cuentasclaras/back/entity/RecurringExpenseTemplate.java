package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_expense_templates")
public class RecurringExpenseTemplate {

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

    @Column(name = "cargado_por_email", nullable = false)
    private String cargadoPorEmail;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "last_generated_year")
    private Integer lastGeneratedYear;

    @Column(name = "last_generated_month")
    private Integer lastGeneratedMonth;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public RecurringExpenseTemplate() {}

    public RecurringExpenseTemplate(Consortium consortium, String descripcion,
                                    BigDecimal monto, String categoria,
                                    String cargadoPorEmail) {
        this.consortium       = consortium;
        this.descripcion      = descripcion;
        this.monto            = monto;
        this.categoria        = categoria;
        this.cargadoPorEmail  = cargadoPorEmail;
        this.activo           = true;
        this.createdAt        = LocalDateTime.now();
    }

    public Long getId()                      { return id; }
    public Consortium getConsortium()        { return consortium; }
    public String getDescripcion()           { return descripcion; }
    public void setDescripcion(String d)     { this.descripcion = d; }
    public BigDecimal getMonto()             { return monto; }
    public void setMonto(BigDecimal m)       { this.monto = m; }
    public String getCategoria()             { return categoria; }
    public String getCargadoPorEmail()       { return cargadoPorEmail; }
    public boolean isActivo()                { return activo; }
    public void setActivo(boolean activo)    { this.activo = activo; }
    public Integer getLastGeneratedYear()    { return lastGeneratedYear; }
    public void setLastGeneratedYear(Integer y) { this.lastGeneratedYear = y; }
    public Integer getLastGeneratedMonth()   { return lastGeneratedMonth; }
    public void setLastGeneratedMonth(Integer m) { this.lastGeneratedMonth = m; }
    public LocalDateTime getCreatedAt()      { return createdAt; }
}
