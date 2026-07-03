package com.cuentasclaras.back.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comprobantes")
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false, unique = true)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    // Relative path within the upload directory, e.g. "consortium-1/uuid.pdf"
    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComprobanteStatus status = ComprobanteStatus.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    public Comprobante() {}

    public Comprobante(Payment payment, User uploadedBy, String fileName,
                       String fileType, Long fileSize, String filePath) {
        this.payment = payment;
        this.uploadedBy = uploadedBy;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.filePath = filePath;
        this.status = ComprobanteStatus.PENDIENTE;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId()                     { return id; }
    public Payment getPayment()             { return payment; }
    public User getUploadedBy()             { return uploadedBy; }
    public String getFileName()             { return fileName; }
    public String getFileType()             { return fileType; }
    public Long getFileSize()               { return fileSize; }
    public String getFilePath()             { return filePath; }
    public ComprobanteStatus getStatus()    { return status; }
    public User getReviewedBy()             { return reviewedBy; }
    public String getRejectionReason()      { return rejectionReason; }
    public LocalDateTime getUploadedAt()    { return uploadedAt; }
    public LocalDateTime getReviewedAt()    { return reviewedAt; }

    public void approve(User admin) {
        this.status = ComprobanteStatus.APROBADO;
        this.reviewedBy = admin;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = null;
    }

    public void reject(User admin, String reason) {
        this.status = ComprobanteStatus.RECHAZADO;
        this.reviewedBy = admin;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
    }
}
