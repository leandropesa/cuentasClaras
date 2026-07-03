// back/src/main/java/com/cuentasclaras/back/dto/CreateExpenseRequest.java
package com.cuentasclaras.back.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateExpenseRequest(
        @NotBlank String grupoId,
        @NotBlank String descripcion,
        @NotNull  BigDecimal monto,
        @NotBlank String categoria,
        String fecha,
        @NotBlank String cargadoPor,
        /**
         * "FIJO" → solo ADMIN puede cargarlo.
         * "EXTRAORDINARIO" → cualquier miembro puede cargarlo.
         * Si viene null o vacío se trata como EXTRAORDINARIO.
         */
        String tipoGasto,
        /**
         * Solo para EXTRAORDINARIO:
         * "CONVENIO"   → va a la próxima expensa, no toca el fondo.
         * "EN_MOMENTO" → se paga del fondo ahora mismo.
         * Si viene null y tipoGasto = EXTRAORDINARIO, default = CONVENIO.
         */
        String subTipo
) {}