package com.taskmanagement.api.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TaskStatusRequest(
        @NotBlank @Pattern(regexp = "^(todo|in_progress|done)$") String status,
        Long listId,
        Integer position
) {}
