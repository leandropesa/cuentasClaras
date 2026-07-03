package integration;

import org.junit.jupiter.api.*;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Hereda MockMvc, ObjectMapper y la configuración de test de BaseIntegrationTest
@DisplayName("GET /api/health - Integration")
class HealthControllerIT extends BaseIntegrationTest {

    @Test
    @DisplayName("✅ Debe retornar ok=true sin autenticación")
    void debeRetornarOk() throws Exception {
        // MockMvc tiene una DSL fluida:
        // perform(request) → andExpect(condición) → andExpect(condición) → ...

        mockMvc.perform(
                // GET /api/health sin headers de autenticación
                get("/api/health")
                        .contentType(MediaType.APPLICATION_JSON)
        )
        // status().isOk() → espera HTTP 200
        .andExpect(status().isOk())
        // jsonPath() navega el JSON de la respuesta con sintaxis XPath-like
        // "$.ok" = campo "ok" en la raíz del JSON
        .andExpect(jsonPath("$.ok").value(true))
        .andExpect(jsonPath("$.service").value("cuentas-claras-back"))
        // $.date existe (no importa el valor exacto)
        .andExpect(jsonPath("$.date").exists());
    }
}