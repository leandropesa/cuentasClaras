package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.Consortium;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConsortiumRepository extends JpaRepository<Consortium, Long> {

    @Query("SELECT DISTINCT c FROM Consortium c LEFT JOIN FETCH c.members m LEFT JOIN FETCH m.user")
    List<Consortium> findAll();

    @Query("SELECT c FROM Consortium c LEFT JOIN FETCH c.members m LEFT JOIN FETCH m.user WHERE c.id = :id")
    Optional<Consortium> findById(Long id);

    Optional<Consortium> findByInvitationCode(String invitationCode);

    List<Consortium> findAllByDiaCierre(Integer diaCierre);
}