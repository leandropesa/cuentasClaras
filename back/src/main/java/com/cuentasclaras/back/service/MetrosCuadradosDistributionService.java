package com.cuentasclaras.back.service;

import com.cuentasclaras.back.entity.FamilyHomeMember;
import com.cuentasclaras.back.repository.FamilyHomeMemberRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class MetrosCuadradosDistributionService {

    private final FamilyHomeMemberRepository memberRepository;

    public MetrosCuadradosDistributionService(FamilyHomeMemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public void distribute(List<FamilyHomeMember> members, BigDecimal monto) {
        if (members.isEmpty()) return;
        BigDecimal cuota = monto.divide(BigDecimal.valueOf(members.size()), 2, RoundingMode.HALF_UP);
        for (FamilyHomeMember member : members) {
            member.setBalance(member.getBalance().subtract(cuota));
            memberRepository.save(member);
        }
    }
}
