package com.taskmanagement.api.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByArchivedFalseOrderByTaskListIdAscPositionAsc();

    @Query("""
            SELECT t FROM Task t JOIN FETCH t.taskList
            WHERE LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY t.taskList.id ASC, t.position ASC
            """)
    List<Task> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT COALESCE(MAX(t.position), 0) FROM Task t WHERE t.taskList.id = :listId")
    int findMaxPositionByListId(@Param("listId") Long listId);

    List<Task> findByTaskListIdAndArchivedFalseOrderByPositionAsc(Long listId);

    List<Task> findByStatusOrderByCompletedAtDesc(String status);

    long countByTaskListIdAndArchivedFalse(Long taskListId);

    void deleteByTaskListId(Long taskListId);
}
