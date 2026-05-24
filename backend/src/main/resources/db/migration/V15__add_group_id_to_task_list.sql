ALTER TABLE task_list ADD COLUMN group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE task_list ADD CONSTRAINT chk_task_list_owner
  CHECK (
    (user_id IS NOT NULL AND group_id IS NULL) OR
    (user_id IS NULL     AND group_id IS NOT NULL)
  );
