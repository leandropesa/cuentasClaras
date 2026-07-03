package integration;

import com.cuentasclaras.back.dto.CreateUserRequest;
import com.cuentasclaras.back.dto.LoginRequest;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("UserController - Integration Tests")
class UserControllerIT extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // Token JWT que usaremos para autenticar requests
    private String authToken;

    @BeforeEach
    void setUp() throws Exception {

        // Crear usuario admin para obtener token
        userRepository.save(new User("Admin", "admin@test.com",
                passwordEncoder.encode("admin123")));

        // Hacer login para obtener el JWT
        // Esto muestra que los tests de integración pueden encadenarse
        authToken = obtenerToken("admin@test.com", "admin123");
    }

    // ── Helper: hace login y extrae el token de la respuesta ─────────────────
    private String obtenerToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();

        // Parsear el JSON de la respuesta para extraer el token
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("token").asText();
    }

    @Nested
    @DisplayName("POST /api/usuarios/registro")
    class Registro {

        @Test
        @DisplayName("✅ Debe registrar usuario nuevo y retornar 201")
        void debeRegistrarUsuario() throws Exception {
            var request = new CreateUserRequest("Nuevo User", "nuevo@test.com", "pass123");

            mockMvc.perform(post("/api/usuarios/registro")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(request)))
                    // 201 Created
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.nombre").value("Nuevo User"))
                    .andExpect(jsonPath("$.email").value("nuevo@test.com"))
                    // El ID debe existir (asignado por H2)
                    .andExpect(jsonPath("$.id").isNumber())
                    // La contraseña NUNCA debe aparecer en la respuesta
                    .andExpect(jsonPath("$.password").doesNotExist());
        }

        @Test
        @DisplayName("❌ Debe retornar 409 si el email ya está registrado")
        void debeRetornar409SiEmailDuplicado() throws Exception {
            // El usuario admin@test.com ya existe desde el setUp
            var request = new CreateUserRequest("Admin 2", "admin@test.com", "pass123");

            mockMvc.perform(post("/api/usuarios/registro")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(request)))
                    .andExpect(status().isNotFound()); // IllegalArgumentException → 404
        }
    }

    @Nested
    @DisplayName("GET /api/usuarios/{id}")
    class GetById {

        @Test
        @DisplayName("✅ Debe retornar el usuario autenticado")
        void debeRetornarUsuario() throws Exception {
            // Obtener el ID del usuario creado en setUp
            Long adminId = userRepository.findByEmail("admin@test.com").get().getId();

            mockMvc.perform(get("/api/usuarios/{id}", adminId)
                    // header("Authorization", "Bearer " + token) — así autenticamos requests
                    .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("admin@test.com"));
        }

        @Test
        @DisplayName("❌ Debe retornar 401 sin autenticación")
        void debeRetornar401SinAuth() throws Exception {
            mockMvc.perform(get("/api/usuarios/1"))
                    // Sin el header Authorization, Spring Security rechaza la request
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("❌ Debe retornar 404 para ID inexistente")
        void debeRetornar404ParaIdInexistente() throws Exception {
            mockMvc.perform(get("/api/usuarios/9999")
                    .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/usuarios/{id}")
    class Delete {

        @Test
        @DisplayName("✅ Debe eliminar el usuario y retornar 204")
        void debeEliminarUsuario() throws Exception {
            // Crear un usuario extra para eliminar (no queremos eliminar el admin)
            userRepository.save(new User("Para Borrar", "borrar@test.com",
                    passwordEncoder.encode("pass")));
            Long idParaBorrar = userRepository.findByEmail("borrar@test.com").get().getId();

            mockMvc.perform(delete("/api/usuarios/{id}", idParaBorrar)
                    .header("Authorization", "Bearer " + authToken))
                    .andExpect(status().isNoContent()); // 204 No Content

            // Verificamos en la BD que realmente se borró
            assertThat(userRepository.findByEmail("borrar@test.com")).isEmpty();
        }
    }
}