INSERT INTO task_list (name, position) VALUES
    ('やること',  0),
    ('進行中',    1),
    ('完了',      2);

INSERT INTO card (list_id, title, description, due_date, priority, archived, position) VALUES
    (1, 'ログイン画面を実装する',        'Spring Security + JWT で認証を実装する',   '2026-06-30', 'high',   false, 0),
    (1, 'カード追加 API を実装する',      NULL,                                       '2026-07-15', 'medium', false, 1),
    (2, 'DB スキーマを設計する',          'ER 図を元にテーブルを定義する',            '2026-05-20', 'high',   false, 0),
    (2, 'Flyway マイグレーションを整備する', NULL,                                    NULL,         'low',    false, 1),
    (3, 'プロトタイプを作成する',          'HTML/CSS/JS で画面の動きを確認した',      '2026-05-01', 'medium', false, 0);
