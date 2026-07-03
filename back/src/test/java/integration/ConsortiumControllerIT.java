package integration;

import com.cuentasclaras.back.dto.LoginRequest;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("ConsortiumController - Integration Tests")
class ConsortiumControllerIT extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String memberToken;
    private Long consortiumId;

    @BeforeEach
    void setUp() throws Exception {
        // Crear usuarios
        userRepository.save(new User("Admin", "admin@test.com", passwordEncoder.encode("admin123")));
        userRepository.save(new User("Member", "member@test.com", passwordEncoder.encode("member123")));

        // Obtener tokens
        adminToken  = obtenerToken("admin@test.com", "admin123");
        memberToken = obtenerToken("member@test.com", "member123");

        // Crear un consorcio como admin (para tests que lo necesitan)
        consortiumId = crearConsorcio("Edificio Test", adminToken);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String obtenerToken(String email, String pass) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(new LoginRequest(email, pass))))
                .andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private Long crearConsorcio(String nombre, String token) throws Exception {
        // Map.of() crea un Map literal → Jackson lo convierte a JSON
        MvcResult r = mockMvc.perform(post("/api/consortiums")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("name", nombre, "initialBalance", 0))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(r.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    @Nested
    @DisplayName("POST /api/consortiums")
    class Crear {

        @Test
        @DisplayName("✅ Admin puede crear consorcio")
        void adminPuedeCrearConsorcio() throws Exception {
            mockMvc.perform(post("/api/consortiums")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("name", "Nuevo Edificio", "initialBalance", 5000))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Nuevo Edificio"))
                    // El admin aparece como miembro con rol ADMIN
                    .andExpect(jsonPath("$.members[0].role").value("ADMIN"));
        }

        @Test
        @DisplayName("❌ Sin autenticación retorna 403")
        void sinAuthRetorna403() throws Exception {
            mockMvc.perform(post("/api/consortiums")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("name", "Test", "initialBalance", 0))))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/consortiums/mine")
    class GetMine {

        @Test
        @DisplayName("✅ Retorna solo los grupos del usuario autenticado")
        void retornaSoloGruposDelUsuario() throws Exception {
            mockMvc.perform(get("/api/consortiums/mine")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    // El admin creó un consorcio en setUp, debe aparecer
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("Edificio Test"));
        }

        @Test
        @DisplayName("✅ Member sin grupos retorna lista vacía")
        void memberSinGruposRetornaListaVacia() throws Exception {
            mockMvc.perform(get("/api/consortiums/mine")
                    .header("Authorization", "Bearer " + memberToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    // El member no fue agregado a ningún consorcio
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("POST /api/consortiums/{id}/members")
    class AgregarMiembro {

        @Test
        @DisplayName("✅ Admin puede agregar un nuevo miembro por email")
        void adminPuedeAgregarMiembro() throws Exception {
            mockMvc.perform(post("/api/consortiums/{id}/members", consortiumId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("username", "member@test.com"))))
                    .andExpect(status().isCreated())
                    // El consorcio ahora tiene 2 miembros: admin + member
                    .andExpect(jsonPath("$.members.length()").value(2));
        }

        @Test
        @DisplayName("❌ Member no puede agregar miembros")
        void memberNoPuedeAgregarMiembros() throws Exception {
            // Primero agregar el member al consorcio como miembro regular
            mockMvc.perform(post("/api/consortiums/{id}/members", consortiumId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("username", "member@test.com"))))
                    .andExpect(status().isCreated());

            // Crear un tercer usuario
            userRepository.save(new User("Tercero", "tercero@test.com",
                    passwordEncoder.encode("pass")));

            // Intentar agregar como member → debe fallar
            mockMvc.perform(post("/api/consortiums/{id}/members", consortiumId)
                    .header("Authorization", "Bearer " + memberToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("username", "tercero@test.com"))))
                    .andExpect(status().isNotFound()); // 404 por IllegalArgumentException
        }
    }

    @Nested
    @DisplayName("DELETE /api/consortiums/{id}/members/me")
    class LeaveConsortium {

        @Test
        @DisplayName("✅ Member puede abandonar el consorcio")
        void memberPuedeAbandonar() throws Exception {
            // Primero agregar el member
            mockMvc.perform(post("/api/consortiums/{id}/members", consortiumId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("username", "member@test.com"))))
                    .andExpect(status().isCreated());

            // Ahora el member abandona
            mockMvc.perform(delete("/api/consortiums/{id}/members/me", consortiumId)
                    .header("Authorization", "Bearer " + memberToken))
                    .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("❌ Único admin no puede abandonar el consorcio")
        void unicoAdminNoPuedeAbandonar() throws Exception {
            // El admin es el único miembro y el único admin
            mockMvc.perform(delete("/api/consortiums/{id}/members/me", consortiumId)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }
}