package com.taskmanagement.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 64) @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*[0-9]).+$") String password,
        @NotBlank @Size(max = 50) String nickname
) {
}
