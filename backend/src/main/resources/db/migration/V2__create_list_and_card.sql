CREATE TABLE task_list (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    position   INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE card (
    id          BIGSERIAL    PRIMARY KEY,
    list_id     BIGINT       NOT NULL REFERENCES task_list(id),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    DATE,
    priority    VARCHAR(10)  CHECK (priority IN ('high', 'medium', 'low')),
    archived    BOOLEAN      NOT NULL DEFAULT false,
    position    INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
