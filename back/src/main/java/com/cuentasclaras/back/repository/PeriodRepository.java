package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.Period;
import com.cuentasclaras.back.entity.PeriodStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodRepository extends JpaRepository<Period, Long> {

    Optional<Period> findByConsortiumIdAndEstado(Long consortiumId, PeriodStatus estado);

    List<Period> findByConsortiumIdOrderByFechaAperturaDesc(Long consortiumId);
}
