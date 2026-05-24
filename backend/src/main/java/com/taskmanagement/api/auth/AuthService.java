package com.taskmanagement.api.auth;

import com.taskmanagement.api.security.JwtUtil;
import com.taskmanagement.api.user.User;
import com.taskmanagement.api.user.UserRepository;
import java.util.Optional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
            UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        String token = jwtUtil.generateToken(request.email());
        return new LoginResponse(token);
    }

    public Optional<LoginResponse> register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return Optional.empty();
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setNickname(request.nickname());
        userRepository.save(user);
        String token = jwtUtil.generateToken(request.email());
        return Optional.of(new LoginResponse(token));
    }

    public Optional<MeResponse> getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .map(u -> new MeResponse(u.getEmail(), u.getNickname()));
    }

    @Transactional
    public Optional<MeResponse> updateNickname(String email, String nickname) {
        return userRepository.findByEmail(email)
                .map(u -> {
                    u.setNickname(nickname);
                    userRepository.save(u);
                    return new MeResponse(u.getEmail(), u.getNickname());
                });
    }
}
