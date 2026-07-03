package integration;

import com.cuentasclaras.back.dto.LoginRequest;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("FinanceController - Integration Tests")
class FinanceControllerIT extends BaseIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String memberToken;
    private Long grupoId;
    private Long adminId;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.save(new User("Admin", "admin@test.com", passwordEncoder.encode("admin123")));
        userRepository.save(new User("Member", "member@test.com", passwordEncoder.encode("member123")));

        adminId     = userRepository.findByEmail("admin@test.com").get().getId();
        adminToken  = obtenerToken("admin@test.com", "admin123");
        memberToken = obtenerToken("member@test.com", "member123");

        // Crear consorcio como admin
        grupoId = crearConsorcio("Test Edificio", adminToken);
    }

    private String obtenerToken(String email, String pass) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(new LoginRequest(email, pass)))).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private Long crearConsorcio(String nombre, String token) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/consortiums")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("name", nombre, "initialBalance", 0))))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Nested
    @DisplayName("POST /api/gastos")
    class CrearGasto {

        @Test
        @DisplayName("✅ Admin puede crear gasto FIJO")
        void adminPuedeCrearGastoFijo() throws Exception {
            var body = Map.of(
                    "grupoId",     grupoId.toString(),
                    "descripcion", "Expensas Abril",
                    "monto",       18000,
                    "categoria",   "EXPENSAS",
                    "fecha",       "2026-04-01",
                    "cargadoPor",  adminId.toString(),
                    "tipoGasto",   "FIJO"
            );

            mockMvc.perform(post("/api/gastos")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.descripcion").value("Expensas Abril"))
                    .andExpect(jsonPath("$.tipoGasto").value("FIJO"))
                    .andExpect(jsonPath("$.id").isNotEmpty());
        }

        @Test
        @DisplayName("❌ Member NO puede crear gasto FIJO")
        void memberNoPuedeCrearGastoFijo() throws Exception {
            Long memberId = userRepository.findByEmail("member@test.com").get().getId();

            // Primero agregar member al consorcio
            mockMvc.perform(post("/api/consortiums/{id}/members", grupoId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("username", "member@test.com"))))
                    .andExpect(status().isCreated());

            var body = Map.of(
                    "grupoId",     grupoId.toString(),
                    "descripcion", "Expensas ilegales",
                    "monto",       18000,
                    "categoria",   "EXPENSAS",
                    "fecha",       "2026-04-01",
                    "cargadoPor",  memberId.toString(),
                    "tipoGasto",   "FIJO"
            );

            mockMvc.perform(post("/api/gastos")
                    .header("Authorization", "Bearer " + memberToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body)))
                    .andExpect(status().isNotFound()); // IllegalArgumentException → 404
        }

        @Test
        @DisplayName("✅ Cualquier miembro puede crear gasto EXTRAORDINARIO")
        void miembroPuedeCrearGastoExtraordinario() throws Exception {
            Long memberId = userRepository.findByEmail("member@test.com").get().getId();

            // Agregar member al consorcio
            mockMvc.perform(post("/api/consortiums/{id}/members", grupoId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(Map.of("username", "member@test.com"))))
                    .andExpect(status().isCreated());

            var body = Map.of(
                    "grupoId",     grupoId.toString(),
                    "descripcion", "Plomero emergencia",
                    "monto",       5000,
                    "categoria",   "REPARACIONES",
                    "fecha",       "2026-04-10",
                    "cargadoPor",  memberId.toString(),
                    "tipoGasto",   "EXTRAORDINARIO"
            );

            mockMvc.perform(post("/api/gastos")
                    .header("Authorization", "Bearer " + memberToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.tipoGasto").value("EXTRAORDINARIO"));
        }
    }

    @Nested
    @DisplayName("GET /api/gastos/{grupoId}")
    class GetGastos {

        @Test
        @DisplayName("✅ Debe retornar lista de gastos del grupo")
        void debeRetornarGastos() throws Exception {
            // Crear un gasto primero
            var body = Map.of(
                    "grupoId", grupoId.toString(), "descripcion", "Test",
                    "monto", 1000, "categoria", "OTROS",
                    "cargadoPor", adminId.toString(), "tipoGasto", "EXTRAORDINARIO"
            );
            mockMvc.perform(post("/api/gastos")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(toJson(body))).andExpect(status().isCreated());

            // Consultar los gastos
            mockMvc.perform(get("/api/gastos/{grupoId}", grupoId)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].descripcion").value("Test"));
        }

        @Test
        @DisplayName("✅ Grupo sin gastos retorna lista vacía")
        void grupoSinGastosRetornaListaVacia() throws Exception {
            mockMvc.perform(get("/api/gastos/{grupoId}", grupoId)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/balance/{grupoId}")
    class GetBalance {

        @Test
        @DisplayName("✅ Debe retornar balance de todos los miembros")
        void debeRetornarBalance() throws Exception {
            mockMvc.perform(get("/api/balance/{grupoId}", grupoId)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    // El admin es el único miembro, debe aparecer en el balance
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].nombre").value("Admin"));
        }
    }

    @Nested
    @DisplayName("GET /api/dashboard/{grupoId}")
    class GetDashboard {

        @Test
        @DisplayName("✅ Debe retornar dashboard completo del grupo")
        void debeRetornarDashboard() throws Exception {
            mockMvc.perform(get("/api/dashboard/{grupoId}", grupoId)
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.grupo").exists())
                    .andExpect(jsonPath("$.totalGastos").exists())
                    .andExpect(jsonPath("$.totalPagos").exists())
                    .andExpect(jsonPath("$.miembros").value(1))
                    .andExpect(jsonPath("$.balances").isArray())
                    .andExpect(jsonPath("$.movimientos").isArray());
        }

        @Test
        @DisplayName("❌ Debe retornar 403 sin autenticación")
        void debeRetornar403SinAuth() throws Exception {
            mockMvc.perform(get("/api/dashboard/{grupoId}", grupoId))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("❌ Debe retornar 404 con grupoId inválido")
        void debeRetornar404ConGrupoIdInvalido() throws Exception {
            mockMvc.perform(get("/api/dashboard/{grupoId}", "id-no-numerico")
                    .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isNotFound());
        }
    }
}