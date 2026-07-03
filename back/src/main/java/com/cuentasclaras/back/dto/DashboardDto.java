package com.cuentasclaras.back.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardDto(
        GroupDto grupo,
        BigDecimal totalGastos,
        BigDecimal totalPagos,
        int miembros,
        List<BalanceRowDto> balances,
        List<Map<String, Object>> movimientos
) {
}
