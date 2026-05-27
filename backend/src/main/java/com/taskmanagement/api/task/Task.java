package com.taskmanagement.api.task;

import com.taskmanagement.api.list.TaskList;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "list_id", nullable = false)
    private TaskList taskList;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate dueDate;

    @Column(length = 10)
    private String priority;

    @Column(nullable = false, length = 20)
    private String status;

    private LocalDateTime completedAt;

    @Column(nullable = false)
    private boolean archived;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "assignee_user_id")
    private Long assigneeUserId;

    protected Task() {
    }

    public Long getId() {
        return id;
    }

    public TaskList getTaskList() {
        return taskList;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public boolean isArchived() {
        return archived;
    }

    public int getPosition() {
        return position;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setTaskList(TaskList taskList) {
        this.taskList = taskList;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getAssigneeUserId() {
        return assigneeUserId;
    }

    public void setAssigneeUserId(Long assigneeUserId) {
        this.assigneeUserId = assigneeUserId;
    }
}
