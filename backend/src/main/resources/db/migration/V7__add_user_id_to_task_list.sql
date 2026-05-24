-- 既存テストデータ用の仮ユーザーを挿入
INSERT INTO users (email, password_hash)
VALUES ('dev@example.com', '$2a$10$placeholder_hash_for_dev_user_only');

-- task_list に user_id カラムを追加（まず NULL 許可で追加）
ALTER TABLE task_list ADD COLUMN user_id BIGINT;

-- 既存レコードすべてに仮ユーザーを割り当て
UPDATE task_list SET user_id = (SELECT id FROM users WHERE email = 'dev@example.com');

-- NOT NULL 制約と FK 制約を付与
ALTER TABLE task_list
    ALTER COLUMN user_id SET NOT NULL,
    ADD CONSTRAINT fk_task_list_user FOREIGN KEY (user_id) REFERENCES users(id);
