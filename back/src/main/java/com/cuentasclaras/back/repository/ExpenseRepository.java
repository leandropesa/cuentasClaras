package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByConsortiumIdOrderByFechaGastoDescCreatedAtDesc(Long consortiumId);

    List<Expense> findByConsortiumIdAndPeriodIdOrderByFechaGastoDescCreatedAtDesc(Long consortiumId, Long periodId);

    @Modifying
    @Query("UPDATE Expense e SET e.period.id = :periodId WHERE e.consortium.id = :consortiumId AND e.period IS NULL")
    int assignOrphansToPeriod(@Param("consortiumId") Long consortiumId, @Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(e.monto), 0) FROM Expense e WHERE e.period.id = :periodId")
    BigDecimal sumMontoByPeriodId(@Param("periodId") Long periodId);

    List<Expense> findByConsortiumIdAndFechaGastoBetween(Long consortiumId, LocalDate startDate, LocalDate endDate);

    void deleteByConsortiumId(Long consortiumId);
}