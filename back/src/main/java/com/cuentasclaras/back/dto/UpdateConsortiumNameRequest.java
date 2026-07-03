package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateConsortiumNameRequest(
        @NotBlank String name
) {}
