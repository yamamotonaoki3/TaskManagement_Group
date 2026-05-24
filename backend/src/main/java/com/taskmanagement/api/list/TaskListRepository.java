package com.taskmanagement.api.list;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {

    List<TaskList> findAllByOrderByPositionAsc();

    @Query("SELECT COALESCE(MAX(l.position), -1) FROM TaskList l")
    int findMaxPosition();
}
