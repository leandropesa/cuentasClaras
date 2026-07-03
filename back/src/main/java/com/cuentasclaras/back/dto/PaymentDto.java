package com.cuentasclaras.back.dto;

import java.math.BigDecimal;

public record PaymentDto(
        String id,
        String grupoId,
        String socioId,
        String socioNombre,
        BigDecimal monto,
        String fecha,
        ComprobanteDto comprobante  // null si no tiene comprobante adjunto
) {}
