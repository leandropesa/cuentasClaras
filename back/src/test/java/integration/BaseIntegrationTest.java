package integration;

import com.cuentasclaras.back.CuentasClarasApplication;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

// @SpringBootTest: levanta el contexto COMPLETO de Spring Boot.
// Carga todos los beans, la seguridad, los repositories, todo.
// Es más lento que los tests unitarios pero testea la integración real.
@SpringBootTest(classes = CuentasClarasApplication.class)
// @AutoConfigureMockMvc: configura MockMvc automáticamente.
// MockMvc nos permite hacer requests HTTP sin levantar un servidor real.
@AutoConfigureMockMvc
// @ActiveProfiles("test"): activa application-test.yml con H2
@ActiveProfiles("test")
@Transactional
public abstract class BaseIntegrationTest {

    // MockMvc es la herramienta para hacer requests HTTP en tests.
    // Simula un cliente HTTP que habla directamente con los controllers.
    @Autowired
    protected MockMvc mockMvc;

    // ObjectMapper convierte objetos Java ↔ JSON
    @Autowired
    protected ObjectMapper objectMapper;

    // Helper para convertir objetos a JSON String
    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }
}