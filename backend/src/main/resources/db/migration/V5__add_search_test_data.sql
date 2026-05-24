INSERT INTO task (list_id, title, description, due_date, priority, archived, position) VALUES
    (1, 'Spring Boot の依存関係を整理する',  'spring-boot-starter-web と spring-boot-starter-data-jpa の設定を見直す', '2026-07-01', 'medium', false, 2),
    (1, 'REST API のエラーハンドリングを実装する', 'GlobalExceptionHandler を追加して 400/404/500 を統一する',              '2026-07-10', 'high',   false, 3),
    (2, 'PostgreSQL のインデックスを設計する',  'task テーブルの title・description カラムに全文検索インデックスを検討',   '2026-06-15', 'low',    false, 2),
    (3, 'Spring Security の設定を完了した',   'JWT フィルターと UserDetailsService の実装を完了',                         '2026-05-10', 'high',   true,  1),
    (3, 'REST API の基本仕様をドキュメント化した', 'OpenAPI (Swagger) を使って /api/tasks のスキーマを定義した',           '2026-04-30', 'medium', true,  2);
