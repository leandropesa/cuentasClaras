// back/src/main/java/com/cuentasclaras/back/repository/FundMovementRepository.java
package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.FundMovement;
import com.cuentasclaras.back.entity.FundMovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FundMovementRepository extends JpaRepository<FundMovement, Long> {

    List<FundMovement> findByConsortiumIdOrderByFechaMovimientoDescCreatedAtDesc(Long consortiumId);

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE -m.monto END
        ), 0)
        FROM FundMovement m
        WHERE m.consortium.id = :consortiumId
    """)
    BigDecimal calcularSaldo(Long consortiumId);

    @Query("""
        SELECT COALESCE(SUM(m.monto), 0)
        FROM FundMovement m
        WHERE m.consortium.id = :consortiumId AND m.tipo = :tipo
    """)
    BigDecimal sumByConsortiumIdAndTipo(Long consortiumId, FundMovementType tipo);

    @Query("""
        SELECT COALESCE(SUM(m.monto), 0)
        FROM FundMovement m
        WHERE m.consortium.id = :consortiumId
          AND m.registradoPor.id = :userId
          AND m.tipo = :tipo
    """)
    BigDecimal sumByConsortiumIdUserIdAndTipo(Long consortiumId, Long userId, FundMovementType tipo);
    void deleteByConsortiumId(Long consortiumId);
}