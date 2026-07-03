package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.ConsortiumRole;
import com.cuentasclaras.back.entity.FamilyHomeMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FamilyHomeMemberRepository extends JpaRepository<FamilyHomeMember, Long> {

    List<FamilyHomeMember> findByFamilyHomeId(Long familyHomeId);

    List<FamilyHomeMember> findByUserId(Long userId);

    Optional<FamilyHomeMember> findByFamilyHomeIdAndUserId(Long familyHomeId, Long userId);

    boolean existsByFamilyHomeIdAndUserIdAndRole(Long familyHomeId, Long userId, ConsortiumRole role);
}