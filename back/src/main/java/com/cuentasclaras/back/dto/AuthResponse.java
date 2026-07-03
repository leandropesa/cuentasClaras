package com.cuentasclaras.back.dto;

public record AuthResponse(
        String token,
        String tokenType,
        String refreshToken) {
}
