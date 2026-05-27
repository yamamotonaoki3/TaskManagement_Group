package com.taskmanagement.api.task;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
        Long id,
        Long listId,
        String listName,
        Long groupId,
        String title,
        String description,
        LocalDate dueDate,
        String priority,
        String status,
        LocalDateTime completedAt,
        boolean archived,
        int position,
        LocalDateTime createdAt,
        Long assigneeUserId,
        String assigneeNickname
) {
    static TaskResponse from(Task task, String assigneeNickname) {
        return new TaskResponse(
                task.getId(),
                task.getTaskList().getId(),
                task.getTaskList().getName(),
                task.getTaskList().getGroupId(),
                task.getTitle(),
                task.getDescription(),
                task.getDueDate(),
                task.getPriority(),
                task.getStatus(),
                task.getCompletedAt(),
                task.isArchived(),
                task.getPosition(),
                task.getCreatedAt(),
                task.getAssigneeUserId(),
                assigneeNickname
        );
    }
}
