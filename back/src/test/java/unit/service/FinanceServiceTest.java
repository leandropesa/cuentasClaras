package unit.service;

import com.cuentasclaras.back.dto.CreateExpenseRequest;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.repository.*;
import com.cuentasclaras.back.service.FinanceService;
import com.cuentasclaras.back.service.GroupService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FinanceService - Tests Unitarios")
class FinanceServiceTest {

        @Mock private GroupService groupService;
        @Mock private ExpenseRepository expenseRepository;
        @Mock private ConsortiumRepository consortiumRepository;
        @Mock private ConsortiumMemberRepository memberRepository;
        @Mock private UserRepository userRepository;
        @Mock private com.cuentasclaras.back.repository.FundMovementRepository fundMovementRepository;

    @InjectMocks
    private FinanceService financeService;

    private User adminUser;
    private User memberUser;
    private Consortium consorcio;

    @BeforeEach
    void setUp() {
        adminUser  = new User("Admin", "admin@test.com", "hash");
        memberUser = new User("Member", "member@test.com", "hash");
        org.springframework.test.util.ReflectionTestUtils.setField(adminUser,  "id", 1L);
        org.springframework.test.util.ReflectionTestUtils.setField(memberUser, "id", 2L);

        consorcio = new Consortium("Test", new BigDecimal("5000"));
        org.springframework.test.util.ReflectionTestUtils.setField(consorcio, "id", 1L);
    }

    @Nested
    @DisplayName("createExpense()")
    class CreateExpense {

        @Test
        @DisplayName("✅ Cualquier miembro puede crear un gasto EXTRAORDINARIO")
        void cualquierMiembroPuedaCrearGastoExtraordinario() {
            // ARRANGE
            var request = new CreateExpenseRequest(
                    "1", "Plomero", new BigDecimal("5000"),
                    "REPARACIONES", "2026-04-10", "2", "EXTRAORDINARIO", "CONVENIO"
            );

            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(memberUser));
            // Para EXTRAORDINARIO, NO se verifica si es admin, así que no mockeamos eso
            when(expenseRepository.save(any(Expense.class)))
                    .thenAnswer(inv -> inv.getArgument(0)); // devuelve el mismo objeto

            // ACT
            var resultado = financeService.createExpense(request, "member@test.com");

            // ASSERT
            assertThat(resultado).isNotNull();
            assertThat(resultado.descripcion()).isEqualTo("Plomero");
            assertThat(resultado.tipoGasto()).isEqualTo("EXTRAORDINARIO");
            // Para gastos extraordinarios, NUNCA verificamos si es admin
            verify(memberRepository, never()).existsByConsortiumIdAndUserIdAndRole(
                    anyLong(), anyLong(), any());
        }

        @Test
        @DisplayName("✅ Solo ADMIN puede crear gasto FIJO")
        void soloAdminPuedaCrearGastoFijo() {
            // ARRANGE
            var request = new CreateExpenseRequest(
                    "1", "Expensas Abril", new BigDecimal("18000"),
                    "EXPENSAS", "2026-04-01", "1", "FIJO", null
            );

            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
            // El usuario ES admin
            when(memberRepository.existsByConsortiumIdAndUserIdAndRole(1L, 1L, ConsortiumRole.ADMIN))
                    .thenReturn(true);
            when(expenseRepository.save(any(Expense.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // ACT
            var resultado = financeService.createExpense(request, "admin@test.com");

            // ASSERT
            assertThat(resultado.tipoGasto()).isEqualTo("FIJO");
            // SÍ debe verificar el rol para gastos fijos
            verify(memberRepository, times(1)).existsByConsortiumIdAndUserIdAndRole(
                    1L, 1L, ConsortiumRole.ADMIN);
        }

        @Test
        @DisplayName("❌ No-ADMIN no puede crear gasto FIJO")
        void noAdminNoPuedeCrearGastoFijo() {
            // ARRANGE
            var request = new CreateExpenseRequest(
                    "1", "Expensas Abril", new BigDecimal("18000"),
                    "EXPENSAS", "2026-04-01", "2", "FIJO", null
            );

            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(memberUser));
            // El usuario NO es admin
            when(memberRepository.existsByConsortiumIdAndUserIdAndRole(1L, 2L, ConsortiumRole.ADMIN))
                    .thenReturn(false);

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    financeService.createExpense(request, "member@test.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Solo el administrador");
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción con tipoGasto inválido")
        void debeLanzarExcepcionConTipoGastoInvalido() {
            // ARRANGE
            var request = new CreateExpenseRequest(
                    "1", "Gasto raro", new BigDecimal("100"),
                    "OTROS", null, "1", "INVALIDO", null
            );
            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    financeService.createExpense(request, "admin@test.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("tipoGasto inválido");
        }

        @Test
        @DisplayName("✅ tipoGasto null debe tratarse como EXTRAORDINARIO")
        void tipoGastoNullDebeSerExtraordinario() {
            // ARRANGE: tipoGasto = null → debe defaultear a EXTRAORDINARIO
            var request = new CreateExpenseRequest(
                    "1", "Gasto sin tipo", new BigDecimal("200"),
                    "OTROS", null, "1", null, null
            );

            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(expenseRepository.save(any(Expense.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // El usuario puede ser cualquiera; mockeamos para evitar "Usuario no encontrado"
            when(userRepository.findByEmail("cualquiera@test.com")).thenReturn(Optional.of(memberUser));

            // ACT
            var resultado = financeService.createExpense(request, "cualquiera@test.com");

            // ASSERT
            assertThat(resultado.tipoGasto()).isEqualTo("EXTRAORDINARIO");
        }
    }
}