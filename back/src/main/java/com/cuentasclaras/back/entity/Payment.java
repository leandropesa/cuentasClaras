package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consortium_id", nullable = false)
    private Consortium consortium;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monto;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id")
    private Period period;

    @OneToOne(mappedBy = "payment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Comprobante comprobante;

    public Payment() {}

    public Payment(Consortium consortium, User user, BigDecimal monto, LocalDate fechaPago) {
        this.consortium = consortium;
        this.user = user;
        this.monto = monto;
        this.fechaPago = fechaPago;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId()                    { return id; }
    public Consortium getConsortium()      { return consortium; }
    public Period getPeriod()              { return period; }
    public void setPeriod(Period period)   { this.period = period; }
    public User getUser()                  { return user; }
    public BigDecimal getMonto()           { return monto; }
    public LocalDate getFechaPago()        { return fechaPago; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
    public Comprobante getComprobante()    { return comprobante; }
    public void setComprobante(Comprobante c) { this.comprobante = c; }
}
