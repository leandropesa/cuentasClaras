package integration;

import com.cuentasclaras.back.dto.LoginRequest;
import com.cuentasclaras.back.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.cuentasclaras.back.entity.User;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("POST /api/auth - Integration")
class AuthControllerIT extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // @BeforeEach: antes de cada test creamos un usuario limpio.
    // @AfterEach: después de cada test limpiamos la BD para no contaminar otros tests.
    // Con H2 y create-drop, la BD se reinicia entre clases, pero no entre métodos.
    @BeforeEach
    void setUp() {
        userRepository.save(
                new User("Test User", "test@test.com",
                        passwordEncoder.encode("password123"))
        );
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("✅ Debe retornar tokens con credenciales válidas")
        void debeRetornarTokensConCredencialesValidas() throws Exception {
            var body = new LoginRequest("test@test.com", "password123");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body)))
                    .andExpect(status().isOk())
                    // Verificamos que la respuesta tiene los campos esperados
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.refreshToken").isNotEmpty());
        }

        @Test
        @DisplayName("❌ Debe retornar 404 con usuario inexistente")
        void debeRetornar404ConUsuarioInexistente() throws Exception {
            var body = new LoginRequest("noexiste@test.com", "password123");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body)))
                    // El ApiExceptionHandler mapea IllegalArgumentException → 404
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("❌ Debe retornar 404 con contraseña incorrecta")
        void debeRetornar404ConPasswordIncorrecta() throws Exception {
            var body = new LoginRequest("test@test.com", "wrongpassword");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body)))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("❌ Debe retornar 400 con request inválido (email sin formato)")
        void debeRetornar400ConRequestInvalido() throws Exception {
            // LoginRequest tiene @Email en el campo email, Spring Validation lo rechaza
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"no-es-email\",\"password\":\"pass\"}"))
                    .andExpect(status().isBadRequest());
        }
    }
}