package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFamilyHomeNameRequest(
        @NotBlank String name
) {}
