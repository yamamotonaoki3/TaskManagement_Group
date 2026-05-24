package com.taskmanagement.api.task;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        Long listId,
        String listName,
        String title,
        String description,
        LocalDate dueDate,
        String priority,
        String status,
        LocalDateTime completedAt,
        boolean archived,
        int position,
        LocalDateTime createdAt
) {
    static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTaskList().getId(),
                task.getTaskList().getName(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getPriority(),
                task.getStatus(),
                task.getCompletedAt(),
                task.isArchived(),
                task.getPosition(),
                task.getCreatedAt()
        );
    }
}
