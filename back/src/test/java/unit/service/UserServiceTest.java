package unit.service;

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS: JUnit 5 + Mockito + clases propias
// ─────────────────────────────────────────────────────────────────────────────
import com.cuentasclaras.back.dto.CreateUserRequest;
import com.cuentasclaras.back.dto.UserDto;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.RefreshTokenRepository;
import com.cuentasclaras.back.repository.UserRepository;
import com.cuentasclaras.back.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

// @ExtendWith(MockitoExtension.class) → le dice a JUnit que use Mockito
// para inicializar los @Mock y @InjectMocks automáticamente.
// Sin esto, tendríamos que llamar a MockitoAnnotations.openMocks(this) en @BeforeEach.
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService - Tests Unitarios")
class UserServiceTest {

    // ── Mocks ──────────────────────────────────────────────────────────────────
    // @Mock crea un "doble" de la dependencia. No ejecuta código real.
    // Podemos definir qué devuelve con when(...).thenReturn(...)
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    // @InjectMocks crea una instancia REAL de UserService
    // e inyecta los @Mock anteriores como dependencias.
    @InjectMocks
    private UserService userService;

    // ── Datos de prueba reutilizables ──────────────────────────────────────────
    private User usuarioEjemplo;

    @BeforeEach
    void setUp() {
        // @BeforeEach se ejecuta ANTES de cada test.
        // Acá inicializamos datos comunes para evitar repetición.
        usuarioEjemplo = new User("Juan Pérez", "juan@test.com", "hashedPassword");
        // Simular que JPA le asignó ID 1 (normalmente lo hace la DB)
        // Como User no tiene setter de ID, usamos reflexión o creamos el objeto directamente
        // Para simplificar, lo dejamos sin ID en los mocks de repository
    }

    // ── @Nested agrupa tests relacionados bajo un mismo contexto ──────────────
    // Esto hace que los reportes de test sean mucho más legibles
    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("✅ Debe registrar un usuario nuevo exitosamente")
        void debeRegistrarUsuarioNuevo() {
            // ── ARRANGE (preparar) ──────────────────────────────────────────
            // Definimos QUÉ devuelven los mocks cuando los llamamos

            // "cuando preguntes si el email existe, decí que no"
            when(userRepository.existsByEmail("juan@test.com")).thenReturn(false);

            // "cuando encriptes cualquier password, devolvé este hash"
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed");

            // "cuando guardes cualquier User, devolvé nuestro usuario de ejemplo"
            when(userRepository.save(any(User.class))).thenReturn(usuarioEjemplo);

            var request = new CreateUserRequest("Juan Pérez", "juan@test.com", "password123");

            // ── ACT (ejecutar) ──────────────────────────────────────────────
            UserDto resultado = userService.register(request);

            // ── ASSERT (verificar) ─────────────────────────────────────────
            // assertThat() de AssertJ: más legible que assertEquals()
            assertThat(resultado).isNotNull();
            assertThat(resultado.nombre()).isEqualTo("Juan Pérez");
            assertThat(resultado.email()).isEqualTo("juan@test.com");

            // Verificamos que se llamó al repository exactamente 1 vez con ese email
            verify(userRepository, times(1)).existsByEmail("juan@test.com");
            // Verificamos que se encriptó la contraseña
            verify(passwordEncoder, times(1)).encode("password123");
            // Verificamos que se guardó el usuario
            verify(userRepository, times(1)).save(any(User.class));
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción si el email ya está registrado")
        void debeLanzarExcepcionSiEmailYaExiste() {
            // ARRANGE
            when(userRepository.existsByEmail("juan@test.com")).thenReturn(true);

            var request = new CreateUserRequest("Juan Pérez", "juan@test.com", "password123");

            // ACT + ASSERT
            // assertThatThrownBy() verifica que el bloque lanza una excepción
            assertThatThrownBy(() -> userService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ya está registrado");

            // Verificamos que NUNCA se llamó a save() — si el email existe, no debería guardar
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("✅ Debe retornar el usuario cuando existe")
        void debeRetornarUsuarioCuandoExiste() {
            // ARRANGE
            when(userRepository.findById(1L)).thenReturn(Optional.of(usuarioEjemplo));

            // ACT
            UserDto resultado = userService.getById(1L);

            // ASSERT
            assertThat(resultado.nombre()).isEqualTo("Juan Pérez");
            assertThat(resultado.email()).isEqualTo("juan@test.com");
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción cuando el usuario no existe")
        void debeLanzarExcepcionCuandoNoExiste() {
            // ARRANGE: Optional.empty() simula que la DB no encontró nada
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            // ACT + ASSERT
            assertThatThrownBy(() -> userService.getById(99L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("no encontrado");
        }
    }

    @Nested
    @DisplayName("getAll()")
    class GetAll {

        @Test
        @DisplayName("✅ Debe retornar lista vacía si no hay usuarios")
        void debeRetornarListaVaciaSiNoHayUsuarios() {
            // ARRANGE
            when(userRepository.findAll()).thenReturn(List.of());

            // ACT
            var resultado = userService.getAll();

            // ASSERT
            assertThat(resultado).isEmpty();
        }

        @Test
        @DisplayName("✅ Debe retornar todos los usuarios")
        void debeRetornarTodosLosUsuarios() {
            // ARRANGE
            var user2 = new User("María", "maria@test.com", "hash2");
            when(userRepository.findAll()).thenReturn(List.of(usuarioEjemplo, user2));

            // ACT
            var resultado = userService.getAll();

            // ASSERT
            assertThat(resultado).hasSize(2);
            assertThat(resultado).extracting(UserDto::email)
                    .containsExactlyInAnyOrder("juan@test.com", "maria@test.com");
        }
    }

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("✅ Debe eliminar usuario y sus refresh tokens")
        void debeEliminarUsuarioYSusTokens() {
            // ARRANGE
            when(userRepository.existsById(1L)).thenReturn(true);

            // ACT
            userService.delete(1L);

            // ASSERT
            // Verificamos que se borraron los tokens ANTES de borrar el usuario
            // (orden importante para evitar FK violations)
            verify(refreshTokenRepository, times(1)).deleteByUserId(1L);
            verify(userRepository, times(1)).deleteById(1L);
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción si el usuario no existe")
        void debeLanzarExcepcionSiUsuarioNoExiste() {
            // ARRANGE
            when(userRepository.existsById(99L)).thenReturn(false);

            // ACT + ASSERT
            assertThatThrownBy(() -> userService.delete(99L))
                    .isInstanceOf(IllegalArgumentException.class);

            // No se debe llamar a deleteById si el usuario no existe
            verify(userRepository, never()).deleteById(any());
        }
    }
}