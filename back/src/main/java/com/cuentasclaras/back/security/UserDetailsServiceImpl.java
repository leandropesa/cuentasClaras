package com.cuentasclaras.back.security;

import com.cuentasclaras.back.entity.ConsortiumRole;
import com.cuentasclaras.back.entity.User;
import com.cuentasclaras.back.repository.ConsortiumMemberRepository;
import com.cuentasclaras.back.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final ConsortiumMemberRepository consortiumMemberRepository;

    public UserDetailsServiceImpl(UserRepository userRepository,
                                ConsortiumMemberRepository consortiumMemberRepository) {
        this.userRepository = userRepository;
        this.consortiumMemberRepository = consortiumMemberRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // Cargar roles: si es ADMIN en algún consorcio, tiene ROLE_ADMIN
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        var isAdmin = consortiumMemberRepository.findByUserId(user.getId())
                .stream()
                .anyMatch(m -> m.getRole() == ConsortiumRole.ADMIN);

        if (isAdmin) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_MEMBER"));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }
}
