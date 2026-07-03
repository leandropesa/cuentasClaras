package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.FamilyHomeExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FamilyHomeExpenseRepository extends JpaRepository<FamilyHomeExpense, Long> {

    List<FamilyHomeExpense> findByFamilyHomeIdOrderByFechaGastoDescCreatedAtDesc(Long familyHomeId);
}