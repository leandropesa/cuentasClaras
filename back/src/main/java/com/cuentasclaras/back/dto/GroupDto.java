package com.cuentasclaras.back.dto;

import java.util.List;

public record GroupDto(
        String id,
        String nombre,
        String tipo,
        List<MemberDto> miembros
) {
}
