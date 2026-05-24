ALTER TABLE task
    ADD COLUMN status       VARCHAR(20) NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'done')),
    ADD COLUMN completed_at TIMESTAMP;
