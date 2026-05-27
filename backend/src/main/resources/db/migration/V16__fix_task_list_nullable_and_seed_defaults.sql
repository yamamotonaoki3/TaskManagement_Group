-- user_id の NOT NULL 制約を解除（group_id を持つグループ用リストで user_id が null になるため）
ALTER TABLE task_list ALTER COLUMN user_id DROP NOT NULL;

-- デフォルトリストを持たない既存ユーザーにデフォルトリストを作成
INSERT INTO task_list (user_id, name, position, is_default, created_at)
SELECT u.id, v.name, v.pos, true, NOW()
FROM users u
CROSS JOIN (VALUES ('やること', 0), ('進行中', 1), ('完了', 2)) AS v(name, pos)
WHERE NOT EXISTS (SELECT 1 FROM task_list tl WHERE tl.user_id = u.id);
