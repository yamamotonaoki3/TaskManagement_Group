package com.taskmanagement.api.group;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteMemberRequest(
        @NotBlank
        @Email
        String email
) {
}
