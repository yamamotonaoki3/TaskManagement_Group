ALTER TABLE task_list ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE task_list SET is_default = TRUE
WHERE name IN ('やること', '進行中', '完了');
