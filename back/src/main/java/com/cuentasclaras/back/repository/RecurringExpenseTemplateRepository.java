package com.cuentasclaras.back.repository;

import com.cuentasclaras.back.entity.RecurringExpenseTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecurringExpenseTemplateRepository extends JpaRepository<RecurringExpenseTemplate, Long> {

    List<RecurringExpenseTemplate> findByConsortiumIdOrderByCreatedAtDesc(Long consortiumId);

    List<RecurringExpenseTemplate> findAllByActivoTrue();
}
