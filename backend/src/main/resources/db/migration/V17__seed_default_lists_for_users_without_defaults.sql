-- V16 では「リストが1件もないユーザー」のみを対象にしたが、
-- 非デフォルトリストしか持たないユーザーにもデフォルトリストを作成する
INSERT INTO task_list (user_id, name, position, is_default, created_at)
SELECT u.id, v.name, v.pos, true, NOW()
FROM users u
CROSS JOIN (VALUES ('やること', 0), ('進行中', 1), ('完了', 2)) AS v(name, pos)
WHERE NOT EXISTS (
    SELECT 1 FROM task_list tl
    WHERE tl.user_id = u.id AND tl.is_default = true
);
