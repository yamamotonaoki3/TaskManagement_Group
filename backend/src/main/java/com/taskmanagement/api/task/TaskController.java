package com.taskmanagement.api.task;

import com.taskmanagement.api.task.dto.TaskRequest;
import com.taskmanagement.api.task.dto.TaskStatusRequest;
import com.taskmanagement.api.task.dto.TaskUpdateRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<TaskResponse> getAll() {
        return taskService.findAll();
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@PathVariable Long id) {
        return taskService.findById(id);
    }

    @GetMapping("/search")
    public List<TaskResponse> search(@RequestParam(required = false) String q) {
        return taskService.search(q);
    }

    @GetMapping("/completed")
    public List<TaskResponse> completed(
            @RequestParam(required = false) String titleQ,
            @RequestParam(required = false) String descQ) {
        return taskService.searchCompleted(titleQ, descQ);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@RequestBody @Valid TaskRequest req) {
        return taskService.create(req);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(@PathVariable Long id, @RequestBody @Valid TaskStatusRequest req) {
        return taskService.updateStatus(id, req);
    }

    @PatchMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @RequestBody @Valid TaskUpdateRequest req) {
        return taskService.updateTask(id, req);
    }

    @PatchMapping("/{id}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable Long id) {
        taskService.archive(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskService.deleteById(id);
    }
}
