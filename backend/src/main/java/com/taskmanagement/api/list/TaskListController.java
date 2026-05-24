package com.taskmanagement.api.list;

import com.taskmanagement.api.task.TaskService;
import com.taskmanagement.api.task.dto.TaskReorderRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lists")
public class TaskListController {

    private final TaskListService taskListService;
    private final TaskService taskService;

    public TaskListController(TaskListService taskListService, TaskService taskService) {
        this.taskListService = taskListService;
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskListResponse> getAll() {
        return taskListService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskListResponse create(@RequestBody @Valid TaskListRequest req) {
        return taskListService.create(req);
    }

    @PatchMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderLists(@RequestBody @Valid ListReorderRequest req) {
        taskListService.reorderLists(req.listIds());
    }

    @DeleteMapping("/{listId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long listId) {
        taskListService.delete(listId);
    }

    @PatchMapping("/{listId}/tasks/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderTasks(@PathVariable Long listId,
                             @RequestBody @Valid TaskReorderRequest req) {
        taskService.reorderByIds(listId, req.taskIds());
    }
}
