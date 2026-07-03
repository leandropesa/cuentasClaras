package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.Invitation;
import com.cuentasclaras.back.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    Optional<Invitation> findByToken(String token);
    Optional<Invitation> findByConsortiumIdAndEmailAndStatus(Long consortiumId, String email, InvitationStatus status);
    List<Invitation> findByEmailAndStatus(String email, InvitationStatus status);
    boolean existsByConsortiumIdAndEmailAndStatus(Long consortiumId, String email, InvitationStatus status);
    void deleteByConsortiumId(Long consortiumId);
    List<Invitation> findByConsortiumIdAndStatus(Long consortiumId, InvitationStatus status);
}
