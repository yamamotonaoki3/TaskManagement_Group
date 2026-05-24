package com.taskmanagement.api.task.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TaskRequest(
        @NotNull Long listId,
        @NotBlank @Size(max = 100) String title,
        @Size(max = 2000) String description,
        @FutureOrPresent LocalDate dueDate,
        @Pattern(regexp = "^(high|medium|low)$") String priority
) {}
