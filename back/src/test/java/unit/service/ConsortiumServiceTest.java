package unit.service;

import com.cuentasclaras.back.dto.AddMemberRequest;
import com.cuentasclaras.back.dto.CreateConsortiumRequest;
import com.cuentasclaras.back.entity.*;
import com.cuentasclaras.back.repository.*;
import com.cuentasclaras.back.service.ConsortiumService;
import com.cuentasclaras.back.service.InvitationService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConsortiumService - Tests Unitarios")
class ConsortiumServiceTest {

    @Mock private ConsortiumRepository consortiumRepository;
    @Mock private ConsortiumMemberRepository consortiumMemberRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private ConsortiumService consortiumService;

    // Entidades de prueba
    private User adminUser;
    private User memberUser;
    private Consortium consorcio;
    private ConsortiumMember adminMembership;

    @BeforeEach
    void setUp() {
        adminUser  = new User("Admin", "admin@test.com", "hash");
        memberUser = new User("Miembro", "member@test.com", "hash");

        // Setear IDs via reflexión (la DB los asigna normalmente)
        org.springframework.test.util.ReflectionTestUtils.setField(adminUser, "id", 1L);
        org.springframework.test.util.ReflectionTestUtils.setField(memberUser, "id", 2L);

        consorcio = new Consortium("Edificio Test", new BigDecimal("10000"));
        org.springframework.test.util.ReflectionTestUtils.setField(consorcio, "id", 1L);

        adminMembership = new ConsortiumMember(consorcio, adminUser, ConsortiumRole.ADMIN);
    }

    @Nested
    @DisplayName("create()")
    class Create {

        @Test
        @DisplayName("✅ Debe crear consorcio y asignar admin al creador")
        void debeCrearConsorcioYAsignarAdmin() {
            // ARRANGE
            when(userRepository.findByEmail("admin@test.com"))
                    .thenReturn(Optional.of(adminUser));
            when(consortiumRepository.save(any(Consortium.class)))
                    .thenReturn(consorcio);
            when(consortiumMemberRepository.save(any(ConsortiumMember.class)))
                    .thenReturn(adminMembership);

            var request = new CreateConsortiumRequest("Edificio Test", new BigDecimal("10000"), null, null, null);

            // ACT
            var resultado = consortiumService.create(request, "admin@test.com");

            // ASSERT
            assertThat(resultado).isNotNull();
            assertThat(resultado.name()).isEqualTo("Edificio Test");
            // El admin debe quedar como miembro con rol ADMIN
            verify(consortiumMemberRepository, times(1)).save(
                    argThat(m -> m.getRole() == ConsortiumRole.ADMIN));
        }

        @Test
        @DisplayName("❌ Debe lanzar excepción si el usuario creador no existe")
        void debeLanzarExcepcionSiCreadorNoExiste() {
            // ARRANGE
            when(userRepository.findByEmail("noexiste@test.com"))
                    .thenReturn(Optional.empty());

            var request = new CreateConsortiumRequest("Test", BigDecimal.ZERO, null, null, null);

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    consortiumService.create(request, "noexiste@test.com"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("addMember()")
    class AddMember {

        @Test
        @DisplayName("✅ Admin puede agregar un nuevo miembro")
        void adminPuedeAgregarMiembro() {
            // ARRANGE
            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(memberUser));
            // El admin SÍ tiene permisos
            when(consortiumMemberRepository.existsByConsortiumIdAndUserIdAndRole(1L, 1L, ConsortiumRole.ADMIN))
                    .thenReturn(true);
            // El nuevo miembro NO está en el consorcio todavía
            when(consortiumMemberRepository.findByConsortiumIdAndUserId(1L, 2L))
                    .thenReturn(Optional.empty());
            when(consortiumMemberRepository.save(any(ConsortiumMember.class)))
                    .thenReturn(new ConsortiumMember(consorcio, memberUser, ConsortiumRole.MEMBER));

            // ACT
            consortiumService.addMember(1L, new AddMemberRequest("member@test.com", null), "admin@test.com");

            // ASSERT
            verify(consortiumMemberRepository, times(1)).save(
                    argThat(m -> m.getRole() == ConsortiumRole.MEMBER));
        }

        @Test
        @DisplayName("❌ No-admin no puede agregar miembros")
        void noAdminNoPuedeAgregarMiembros() {
            // ARRANGE
            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(memberUser));
            // El usuario que intenta agregar NO es admin
            when(consortiumMemberRepository.existsByConsortiumIdAndUserIdAndRole(1L, 2L, ConsortiumRole.ADMIN))
                    .thenReturn(false);

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    consortiumService.addMember(1L, new AddMemberRequest("otro@test.com", null), "member@test.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Only an admin");
        }

        @Test
        @DisplayName("❌ No puede agregar un usuario que ya es miembro")
        void noPuedeAgregarMiembroYaExistente() {
            // ARRANGE
            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(memberUser));
            when(consortiumMemberRepository.existsByConsortiumIdAndUserIdAndRole(1L, 1L, ConsortiumRole.ADMIN))
                    .thenReturn(true);
            // El usuario YA es miembro
            when(consortiumMemberRepository.findByConsortiumIdAndUserId(1L, 2L))
                    .thenReturn(Optional.of(adminMembership));

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    consortiumService.addMember(1L, new AddMemberRequest("member@test.com", null), "admin@test.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ya es parte");
        }
    }

    @Nested
    @DisplayName("leaveConsortium()")
    class LeaveConsortium {

        @Test
        @DisplayName("❌ No puede salir si tiene balance no cero")
        void noPuedeSalirConBalanceNoCero() {
            // ARRANGE
            when(consortiumRepository.findById(1L)).thenReturn(Optional.of(consorcio));
            when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(memberUser));

            var membershipConDeuda = new ConsortiumMember(consorcio, memberUser, ConsortiumRole.MEMBER);
            membershipConDeuda.setBalance(new BigDecimal("-500")); // tiene deuda
            when(consortiumMemberRepository.findByConsortiumIdAndUserId(1L, 2L))
                    .thenReturn(Optional.of(membershipConDeuda));

            // ACT + ASSERT
            assertThatThrownBy(() ->
                    consortiumService.leaveConsortium(1L, "member@test.com"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("non-zero balance");
        }
    }
}