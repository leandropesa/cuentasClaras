package com.cuentasclaras.back.dto;

import java.time.LocalDateTime;

public record UserDto(
        Long id,
        String nombre,
        String email,
        LocalDateTime createdAt
) {}