package com.taskmanagement.api.list;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {

    List<TaskList> findAllByOrderByPositionAsc();

    @Query("SELECT COALESCE(MAX(l.position), -1) FROM TaskList l")
    int findMaxPosition();

    @Query("SELECT l FROM TaskList l WHERE l.userId = :userId OR l.groupId IN :groupIds ORDER BY l.position ASC")
    List<TaskList> findByUserIdOrGroupIdIn(Long userId, java.util.Collection<Long> groupIds);

    List<TaskList> findByGroupId(Long groupId);
}
