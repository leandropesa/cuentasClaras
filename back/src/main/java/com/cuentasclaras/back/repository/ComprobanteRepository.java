package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.Comprobante;
import com.cuentasclaras.back.entity.ComprobanteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    @Query("SELECT c FROM Comprobante c JOIN FETCH c.payment JOIN FETCH c.uploadedBy LEFT JOIN FETCH c.reviewedBy WHERE c.payment.consortium.id = :consortiumId AND c.status = :status ORDER BY c.uploadedAt ASC")
    List<Comprobante> findByConsortiumIdAndStatus(@Param("consortiumId") Long consortiumId,
                                                  @Param("status") ComprobanteStatus status);

    @Query("SELECT c FROM Comprobante c JOIN FETCH c.payment JOIN FETCH c.uploadedBy LEFT JOIN FETCH c.reviewedBy WHERE c.id = :id")
    Optional<Comprobante> findByIdWithDetails(@Param("id") Long id);
}
