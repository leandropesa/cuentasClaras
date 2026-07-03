package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.comprobante WHERE p.consortium.id = :consortiumId ORDER BY p.fechaPago DESC, p.createdAt DESC")
    List<Payment> findByConsortiumIdOrderByFechaPagoDescCreatedAtDesc(@Param("consortiumId") Long consortiumId);

    @Query("SELECT p FROM Payment p LEFT JOIN FETCH p.comprobante WHERE p.consortium.id = :consortiumId AND p.period.id = :periodId ORDER BY p.fechaPago DESC, p.createdAt DESC")
    List<Payment> findByConsortiumIdAndPeriodIdOrderByFechaPagoDescCreatedAtDesc(@Param("consortiumId") Long consortiumId, @Param("periodId") Long periodId);

    @Modifying
    @Query("UPDATE Payment p SET p.period.id = :periodId WHERE p.consortium.id = :consortiumId AND p.period IS NULL")
    int assignOrphansToPeriod(@Param("consortiumId") Long consortiumId, @Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Payment p WHERE p.period.id = :periodId")
    BigDecimal sumMontoByPeriodId(@Param("periodId") Long periodId);

    List<Payment> findByConsortiumIdAndFechaPagoBetween(Long consortiumId, LocalDate startDate, LocalDate endDate);
}
