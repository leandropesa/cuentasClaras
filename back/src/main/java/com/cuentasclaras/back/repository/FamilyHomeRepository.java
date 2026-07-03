package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.FamilyHome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface FamilyHomeRepository extends JpaRepository<FamilyHome, Long> {

    @Query("SELECT DISTINCT f FROM FamilyHome f LEFT JOIN FETCH f.members m LEFT JOIN FETCH m.user")
    List<FamilyHome> findAll();

    @Query("SELECT f FROM FamilyHome f LEFT JOIN FETCH f.members m LEFT JOIN FETCH m.user WHERE f.id = :id")
    Optional<FamilyHome> findById(Long id);

    @Query("SELECT f FROM FamilyHome f LEFT JOIN FETCH f.members m LEFT JOIN FETCH m.user WHERE f.invitationCode = :code")
    Optional<FamilyHome> findByInvitationCode(String code);
}