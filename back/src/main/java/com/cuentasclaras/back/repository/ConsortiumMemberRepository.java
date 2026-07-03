package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.ConsortiumMember;
import com.cuentasclaras.back.entity.ConsortiumRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.cuentasclaras.back.entity.MembershipStatus;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsortiumMemberRepository extends JpaRepository<ConsortiumMember, Long> {

    List<ConsortiumMember> findByConsortiumId(Long consortiumId);

    /** Todas las membresías de un usuario (para el endpoint /mine). */
    List<ConsortiumMember> findByUserId(Long userId);

    Optional<ConsortiumMember> findByConsortiumIdAndUserId(Long consortiumId, Long userId);

    boolean existsByConsortiumIdAndUserId(Long consortiumId, Long userId);

    boolean existsByConsortiumIdAndUserIdAndRole(Long consortiumId, Long userId, ConsortiumRole role);

    List<ConsortiumMember> findByConsortiumIdAndMembershipStatus(
        Long consortiumId, MembershipStatus status);

    List<ConsortiumMember> findByConsortiumIdAndMembershipStatusAndAdminNotificadoFalse(
            Long consortiumId, MembershipStatus status);

    @Query("SELECT m FROM ConsortiumMember m WHERE m.fechaVencimiento IS NOT NULL")
    List<ConsortiumMember> findAllWithFechaVencimiento();

    List<ConsortiumMember> findByUserIdAndMembershipStatus(Long userId, MembershipStatus status);

    List<ConsortiumMember> findByConsortiumIdAndBalanceLessThan(Long consortiumId, BigDecimal balance);
}