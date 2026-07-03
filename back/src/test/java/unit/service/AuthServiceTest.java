package unit.service;

import com.cuentasclaras.back.dto.AuthResponse;
import com.cuentasclaras.back.dto.LoginRequest;
import com.cuentasclaras.back.dto.RefreshTokenRequest;
import com.cuentasclaras.back.entity.RefreshToken;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.RefreshTokenRepository;
import com.cuentasclaras.back.repository.UserRepository;
import com.cuentasclaras.back.security.JwtService;
import com.cuentasclaras.back.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - Tests Unitarios")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;

    private AuthService authService;

    private User usuarioEjemplo;

    @BeforeEach
    void setUp() {

        authService = new AuthService(
            userRepository,
            refreshTokenRepository,
            passwordEncoder,
            jwtService,
            86400000L
        );
        usuarioEjemplo = new User("Admin", "admin@test.com", "$2a$hashedPassword");

        // ReflectionTestUtils.setField: inyecta valores en campos privados.
        // AuthService tiene @Value("${jwt.refresh-expiration-ms}") que Spring normalmente inyecta.
        // En tests unitarios no hay contexto Spring, así que lo inyectamos "a mano".
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 86400000L);
    }

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("✅ Debe retornar tokens cuando las credenciales son correctas")
        void debeRetornarTokensConCredencialesCorrectas() {
            // ARRANGE
            var request = new LoginRequest("admin@test.com", "password123");

            when(userRepository.findByEmail("admin@test.com"))
                    .thenReturn(Optional.of(usuarioEjemplo));
            // "cuando compares 'password123' contra el hash almacenado, confirmá que coincide"
            when(passwordEncoder.matches("password123", "$2a$hashedPassword"))
                    .thenReturn(true);
            when(jwtService.generateToken(any(), any()))
                    .thenReturn("jwt-access-token");

            // Simulamos que al guardar el RefreshToken, devuelve uno con token asignado
            var refreshToken = new RefreshToken("refresh-uuid", usuarioEjemplo,
                    LocalDateTime.now().plusDays(1));
            when(refreshTokenRepository.save(any(RefreshToken.class)))
                    .thenReturn(refreshToken);

            // ACT
            AuthResponse response = authService.login(request);

            // ASSERT
            assertThat(response).isNotNull();
            assertThat(response.token()).isEqualTo("jwt-access-token");
            assertThat(response.tokenType()).isEqualTo("Bearer");
            assertThat(response.refreshToken()).isEqualTo("refresh-uuid");
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción cuando el usuario no existe")
        void debeLanzarExcepcionSiUsuarioNoExiste() {
            // ARRANGE
            when(userRepository.findByEmail("noexiste@test.com"))
                    .thenReturn(Optional.empty());

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    authService.login(new LoginRequest("noexiste@test.com", "pass")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no encontrado");

            // Nunca debe generar un token si el usuario no existe
            verify(jwtService, never()).generateToken(any(), any());
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción cuando la contraseña es incorrecta")
        void debeLanzarExcepcionSiPasswordIncorrecta() {
            // ARRANGE
            when(userRepository.findByEmail("admin@test.com"))
                    .thenReturn(Optional.of(usuarioEjemplo));
            when(passwordEncoder.matches(anyString(), anyString()))
                    .thenReturn(false); // contraseña NO coincide

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    authService.login(new LoginRequest("admin@test.com", "wrongpass")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Contraseña incorrecta");
        }
    }

    @Nested
    @DisplayName("refresh()")
    class Refresh {

        @Test
        @DisplayName("✅ Debe renovar los tokens con un refresh token válido")
        void debeRenovarTokensConRefreshTokenValido() {
            // ARRANGE
            var refreshToken = new RefreshToken(
                    "valid-refresh-token",
                    usuarioEjemplo,
                    LocalDateTime.now().plusHours(1) // no expirado
            );

            when(refreshTokenRepository.findByToken("valid-refresh-token"))
                    .thenReturn(Optional.of(refreshToken));
            when(jwtService.generateToken(any(), any()))
                    .thenReturn("nuevo-access-token");

            var nuevoRefreshToken = new RefreshToken("nuevo-refresh-token", usuarioEjemplo,
                    LocalDateTime.now().plusDays(1));
            when(refreshTokenRepository.save(any(RefreshToken.class)))
                    .thenReturn(nuevoRefreshToken);

            // ACT
            AuthResponse response = authService.refresh(
                    new RefreshTokenRequest("valid-refresh-token"));

            // ASSERT
            assertThat(response.token()).isEqualTo("nuevo-access-token");
            assertThat(response.refreshToken()).isEqualTo("nuevo-refresh-token");
            // Debe borrar el token viejo (rotación de refresh tokens)
            verify(refreshTokenRepository, times(1)).delete(refreshToken);
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción si el refresh token expiró")
        void debeLanzarExcepcionSiTokenExpiro() {
            // ARRANGE: token expirado — la fecha de expiración es en el PASADO
            var tokenExpirado = new RefreshToken(
                    "expired-token",
                    usuarioEjemplo,
                    LocalDateTime.now().minusHours(1) // ya expiró
            );

            when(refreshTokenRepository.findByToken("expired-token"))
                    .thenReturn(Optional.of(tokenExpirado));

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    authService.refresh(new RefreshTokenRequest("expired-token")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("expirado");

            // Debe eliminar el token expirado para limpiar la base
            verify(refreshTokenRepository, times(1)).delete(tokenExpirado);
        }
    }
}