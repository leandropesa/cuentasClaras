package com.cuentasclaras.back.dto;
import jakarta.validation.constraints.NotNull;

public record SetDueDateRequest(
        @NotNull Long consortiumId,
        @NotNull Long userId,
        @NotNull String fechaVencimiento
) {}