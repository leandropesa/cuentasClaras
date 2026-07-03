package com.cuentasclaras.back.service;

import com.cuentasclaras.back.dto.GroupDto;
import com.cuentasclaras.back.dto.MemberDto;
import com.cuentasclaras.back.entity.Consortium;
import com.cuentasclaras.back.repository.ConsortiumRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupService {

    private final ConsortiumRepository consortiumRepository;

    public GroupService(ConsortiumRepository consortiumRepository) {
        this.consortiumRepository = consortiumRepository;
    }

    public List<GroupDto> getAll() {
        return consortiumRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public GroupDto getById(String grupoId) {
        Long id;
        try {
            id = Long.parseLong(grupoId);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Grupo no encontrado: " + grupoId);
        }
        Consortium consortium = consortiumRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado: " + grupoId));
        return toDto(consortium);
    }

    private GroupDto toDto(Consortium c) {
        List<MemberDto> miembros = c.getMembers().stream()
                .map(m -> new MemberDto(
                        String.valueOf(m.getUser().getId()),
                        m.getUser().getNombre(),
                        m.getUser().getEmail()
                ))
                .toList();
        return new GroupDto(
                String.valueOf(c.getId()),
                c.getName(),
                "PROPIEDAD_HORIZONTAL",
                miembros
        );
    }
}