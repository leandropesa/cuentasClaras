package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.AuthResponse;
import com.cuentasclaras.back.dto.LoginRequest;
import com.cuentasclaras.back.dto.RefreshTokenRequest;
import com.cuentasclaras.back.entity.RefreshToken;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.RefreshTokenRepository;
import com.cuentasclaras.back.repository.UserRepository;
import com.cuentasclaras.back.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long refreshExpirationMs;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Contraseña incorrecta");
        }
        String accessToken = jwtService.generateToken(buildPrincipal(user), user.getId());
        String refreshToken = createRefreshToken(user).getToken();

        return new AuthResponse(accessToken, "Bearer", refreshToken);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token invalido"));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new IllegalArgumentException("Refresh token expirado");
        }

        User user = stored.getUser();
        refreshTokenRepository.delete(stored);
        String accessToken = jwtService.generateToken(buildPrincipal(user), user.getId());
        String newRefreshToken = createRefreshToken(user).getToken();

        return new AuthResponse(accessToken, "Bearer", newRefreshToken);
    }

    private RefreshToken createRefreshToken(User user) {
        LocalDateTime expiresAt = LocalDateTime.now().plus(Duration.ofMillis(refreshExpirationMs));
        RefreshToken refreshToken = new RefreshToken(UUID.randomUUID().toString(), user, expiresAt);
        return refreshTokenRepository.save(refreshToken);
    }

    private org.springframework.security.core.userdetails.User buildPrincipal(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                java.util.Collections.emptyList()
        );
    }
}
