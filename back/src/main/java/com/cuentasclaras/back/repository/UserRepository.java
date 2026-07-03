package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Buscar usuario por email (para validar si ya existe al registrarse)
    Optional<User> findByEmail(String email);

    // Verificar si ya existe un email (para validaciones)
    boolean existsByEmail(String email);
}