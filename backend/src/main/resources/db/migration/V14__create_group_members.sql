CREATE TABLE group_members (
  id         BIGSERIAL PRIMARY KEY,
  group_id   BIGINT    NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    BIGINT    NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  joined_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);
