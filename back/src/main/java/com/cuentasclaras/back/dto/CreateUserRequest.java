package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(
        @NotBlank String nombre,
        @Email @NotBlank String email,
        @NotBlank String password
) {}