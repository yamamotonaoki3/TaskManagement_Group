package com.taskmanagement.api.list;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ListReorderRequest(
        @NotNull List<Long> listIds
) {}
