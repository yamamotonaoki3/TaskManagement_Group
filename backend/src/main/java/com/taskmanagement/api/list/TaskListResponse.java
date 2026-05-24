package com.taskmanagement.api.list;

import com.taskmanagement.api.task.Task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record TaskListResponse(
        Long id,
        Long userId,
        String name,
        int position,
        boolean isDefault,
        LocalDateTime createdAt,
        List<TaskSummary> tasks
) {
    public record TaskSummary(
            Long id,
            String title,
            String description,
            LocalDate dueDate,
            String priority,
            String status,
            LocalDateTime completedAt,
            int position,
            LocalDateTime createdAt
    ) {
        static TaskSummary from(Task task) {
            return new TaskSummary(
                    task.getId(),
                    task.getTitle(),
                    task.getDescription(),
                    task.getDueDate(),
                    task.getPriority(),
                    task.getStatus(),
                    task.getCompletedAt(),
                    task.getPosition(),
                    task.getCreatedAt()
            );
        }
    }

    static TaskListResponse from(TaskList list, List<Task> tasks) {
        List<TaskSummary> summaries = tasks.stream()
                .filter(t -> !t.isArchived())
                .sorted(java.util.Comparator.comparingInt(Task::getPosition))
                .map(TaskSummary::from)
                .toList();
        return new TaskListResponse(
                list.getId(),
                list.getUserId(),
                list.getName(),
                list.getPosition(),
                list.isDefault(),
                list.getCreatedAt(),
                summaries
        );
    }
}
