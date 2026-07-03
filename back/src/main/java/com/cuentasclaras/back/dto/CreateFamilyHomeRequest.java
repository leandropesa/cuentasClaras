package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFamilyHomeRequest(
        @NotBlank String name
) {}