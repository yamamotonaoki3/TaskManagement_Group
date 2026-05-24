package com.taskmanagement.api.task.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TaskReorderRequest(
        @NotNull List<Long> taskIds
) {}
