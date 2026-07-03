package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.PeriodMemberSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PeriodMemberSnapshotRepository extends JpaRepository<PeriodMemberSnapshot, Long> {

    List<PeriodMemberSnapshot> findByPeriodId(Long periodId);
}
