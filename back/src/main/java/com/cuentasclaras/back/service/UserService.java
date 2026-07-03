package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.CreateUserRequest;
import com.cuentasclaras.back.dto.UserDto;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.UserRepository;
import com.cuentasclaras.back.repository.RefreshTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public UserDto register(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(request.nombre(), request.email(), passwordHash);
        User guardado = userRepository.save(user);

        return toDto(guardado);
    }
    
    public List<UserDto> getAll() {
        return userRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public UserDto getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return toDto(user);
    }

    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
        refreshTokenRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    // Convierte entidad → DTO
    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getNombre(), user.getEmail(), user.getCreatedAt());
    }
}