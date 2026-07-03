package unit.security;

import com.cuentasclaras.back.security.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import io.jsonwebtoken.ExpiredJwtException;

import java.util.Collections;

import static org.assertj.core.api.Assertions.*;

// Para JwtService no usamos Mockito porque no tiene dependencias que mockear.
// Es pura lógica de JWT — la testeamos directamente.
@DisplayName("JwtService - Tests Unitarios")
class JwtServiceTest {

    private JwtService jwtService;

    // Una clave de al menos 32 chars (256 bits) para HMAC-SHA256
    private static final String SECRET =
            "clave-secreta-de-prueba-con-al-menos-256-bits-para-tests";
    private static final long EXPIRATION_MS = 3_600_000L; // 1 hora

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    // Helper: crea un UserDetails de prueba
    private UserDetails buildUser(String email) {
        return new User(email, "password", Collections.emptyList());
    }

    @Test
    @DisplayName("✅ Debe generar un token no nulo y no vacío")
    void debeGenerarToken() {
        var userDetails = buildUser("test@test.com");
        String token = jwtService.generateToken(userDetails, 1L);
        assertThat(token).isNotBlank();
        // Un JWT tiene 3 partes separadas por puntos
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("✅ Debe extraer el username (email) del token")
    void debeExtraerUsername() {
        var userDetails = buildUser("test@test.com");
        String token = jwtService.generateToken(userDetails, 1L);

        String username = jwtService.extractUsername(token);

        assertThat(username).isEqualTo("test@test.com");
    }

    @Test
    @DisplayName("✅ Token válido debe pasar la validación")
    void tokenValidoDebeSerValido() {
        var userDetails = buildUser("test@test.com");
        String token = jwtService.generateToken(userDetails, 1L);

        boolean esValido = jwtService.isTokenValid(token, userDetails);

        assertThat(esValido).isTrue();
    }

    @Test
    @DisplayName("❌ Token de otro usuario debe fallar la validación")
    void tokenDeOtroUsuarioDebeSerInvalido() {
        var userOtro = buildUser("otro@test.com");
        String tokenOtro = jwtService.generateToken(userOtro, 2L);

        // Intentamos validar el token de "otro" contra "test"
        var userTest = buildUser("test@test.com");
        boolean esValido = jwtService.isTokenValid(tokenOtro, userTest);

        assertThat(esValido).isFalse();
    }

    @Test
    @DisplayName("❌ Token expirado debe fallar la validación")
    void tokenExpiradoDebeSerInvalido() {
        // Creamos un JwtService con expiración de -1ms (ya expiró al crearlo)
        var jwtExpirado = new JwtService(SECRET, -1L);
        var userDetails = buildUser("test@test.com");
        String token = jwtExpirado.generateToken(userDetails, 1L);

        // isTokenValid lanza excepción o devuelve false con token expirado
        assertThatCode(() -> {
            boolean valido = jwtExpirado.isTokenValid(token, userDetails);
            assertThat(valido).isFalse();
        }).doesNotThrowAnyException();
    }
}