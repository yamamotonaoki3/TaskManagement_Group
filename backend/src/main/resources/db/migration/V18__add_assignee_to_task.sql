ALTER TABLE task
    ADD COLUMN assignee_user_id BIGINT NULL,
    ADD CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE SET NULL;
