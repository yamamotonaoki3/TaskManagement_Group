# TaskBoard Backend (api)

Spring Boot 4.0.3 + Java 25 + Gradle (Kotlin DSL) のバックエンド。
現在は DB 接続確認用のデモエンドポイントまで実装済み（本ドメインの USER / LIST / CARD は未着手）。

## 構成

```
backend/
├─ build.gradle.kts                                 # Gradle ビルド設定
├─ settings.gradle.kts                              # プロジェクト名（api）
├─ docker-compose.yml                               # PostgreSQL 17 コンテナ
├─ .gitignore
├─ gradlew / gradlew.bat / gradle/wrapper/          # Gradle Wrapper
└─ src/
    ├─ main/
    │   ├─ java/com/taskmanagement/api/
    │   │   ├─ Application.java                     # エントリポイント
    │   │   └─ sample/                              # ※ 使い捨てデモ（本ドメイン実装時に削除予定）
    │   │       ├─ SampleItem.java                  # JPA エンティティ
    │   │       ├─ SampleItemRepository.java        # JpaRepository
    │   │       └─ SampleItemController.java         # REST コントローラ
    │   └─ resources/
    │       ├─ application.yml                      # アプリ設定（DB 接続・JPA・Flyway）
    │       └─ db/migration/
    │           └─ V1__create_sample_item.sql      # Flyway マイグレーション
    └─ test/
        └─ java/com/taskmanagement/api/
            └─ ApplicationTests.java                # コンテキスト読み込みテスト
```

## 技術スタック

- Java 25 / Spring Boot 4.0.3 / Gradle 9.5.0（Kotlin DSL）
- Spring Web / Spring Data JPA（Hibernate）
- PostgreSQL 17（Docker）
- Flyway（DB マイグレーション）
- **API スタイル**: REST API（JSON over HTTP）

## セットアップと起動

### 1. PostgreSQL を起動（Docker）

```sh
cd backend
docker compose up -d
```

`taskboard-db` コンテナが起動する（`docker ps` で確認）。
- DB 名 / ユーザー / パスワード はすべて `taskboard`（学習用の簡易値）
- ポート 5432 で待ち受け

停止：`docker compose down`（`-v` を付けるとデータボリュームも削除）

### 2. アプリを起動

```sh
cd backend
./gradlew.bat bootRun        # Windows（PowerShell では .\gradlew.bat bootRun）
./gradlew bootRun            # Mac/Linux
```

- 起動時に Flyway が `V1__create_sample_item.sql` を適用する
- ログに `Started Application in X.X seconds` が出れば起動成功
- 停止は Ctrl+C

### 3. 動作確認（DB 接続確認）

```sh
# 一覧（最初は空）
curl http://localhost:8080/api/sample-items

# 1件作成
curl -X POST http://localhost:8080/api/sample-items -H "Content-Type: application/json" -d "{\"name\":\"hello\"}"

# 再度一覧（作成した行が返る）
curl http://localhost:8080/api/sample-items
```

ブラウザで `http://localhost:8080/api/sample-items` を開くと JSON が表示される。

DB を直接確認したい場合：

```sh
docker compose exec db psql -U taskboard -d taskboard -c "SELECT * FROM sample_item;"
```

## テスト実行

```sh
./gradlew test
```

## 注意

- `sample/` パッケージと `V1__create_sample_item.sql` は **DB 接続確認用の使い捨て**。本ドメイン（USER / LIST / CARD）の実装に着手する際に削除し、本来のマイグレーション（`V2__...`）に置き換える予定。
- ホスティング先は未定（候補：Render / Railway / AWS）。
