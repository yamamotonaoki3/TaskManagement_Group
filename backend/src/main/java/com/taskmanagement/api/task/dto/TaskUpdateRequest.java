package com.taskmanagement.api.task.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TaskUpdateRequest(
        @Size(min = 1, max = 100) String title,
        @Size(max = 2000) String description,
        @FutureOrPresent LocalDate dueDate,
        @Pattern(regexp = "^(high|medium|low)$") String priority,
        Long assigneeUserId,
        Boolean clearAssignee
) {}
