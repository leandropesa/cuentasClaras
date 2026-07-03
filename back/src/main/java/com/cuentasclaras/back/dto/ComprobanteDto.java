package com.cuentasclaras.back.dto;

public record ComprobanteDto(
        String id,
        String paymentId,
        String uploadedBy,
        String fileName,
        String fileType,
        Long fileSize,
        String status,           // "PENDIENTE" | "APROBADO" | "RECHAZADO"
        String reviewedBy,       // nullable
        String rejectionReason,  // nullable
        String uploadedAt,
        String reviewedAt        // nullable
) {}
