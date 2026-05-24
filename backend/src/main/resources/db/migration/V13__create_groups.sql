CREATE TABLE groups (
  id         BIGSERIAL    PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  owner_user_id BIGINT    NOT NULL REFERENCES users(id),
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
