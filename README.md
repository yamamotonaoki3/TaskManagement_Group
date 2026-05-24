# TaskManagement

Trello 風カンバンボードで個人タスクを視覚的に管理する Web アプリ。
React 19 + TypeScript（フロントエンド）と Spring Boot 4.0.3 + PostgreSQL 17（バックエンド）で構成する。

---

## 機能フェーズ

| フェーズ | 内容 | 主な機能 | 状況 |
| --- | --- | --- | --- |
| Phase 1 | MVP | カード追加・表示・移動・削除 | ✅ 完了 |
| Phase 2 | 基本機能拡張 | 期限・説明文・ドラッグ&ドロップ・アーカイブ | ✅ 完了 |
| Phase 3 | ユーザー機能 | メール+パスワード認証・ニックネーム・完了タスク一覧 | ✅ 完了 |
| Phase 4 | 便利機能 | 優先度・並び替え・期限警告色・履歴検索 | 🔄 一部完了 |
| Phase 5 | グループ機能 | グループ作成・メンバー招待・タスク共有 | 📋 要件定義のみ |

---

## 実装済み機能（2026-05-21 時点）

### Phase 1 / Phase 2

- カンバンボードでのタスク管理（追加・編集・削除）
- カラム（タスクリスト）の追加・削除
- タスクの期限・説明文の設定
- ドラッグ&ドロップによるタスク並び替え・カラム間移動・カラム順序変更
- タスク完了操作とアーカイブ

### Phase 3

- メールアドレス＋パスワードによるユーザー登録・ログイン・ログアウト
- パスワード入力欄の表示/非表示トグル
- JWT による API 認証（Spring Security）
- ヘッダーへのニックネーム表示・ニックネーム編集
- 完了タスク一覧画面（タイトル・説明文による検索対応）
- タスク検索（フッター配置）
- デフォルトカラム（やること・進行中・完了）の削除保護

### Phase 4（一部）

- 期限が近づくにつれてタスクカードが徐々に赤くなる警告色表示

---

## 技術スタック

### フロントエンド

| 項目 | バージョン |
| --- | --- |
| 言語 | TypeScript 6.0.2 |
| ライブラリ | React 19.2.6 |
| ビルドツール | Vite 8.0.12 |
| ルーティング | React Router 7.15.1 |
| HTTP クライアント | Axios 1.16.1 |
| DnD | @dnd-kit/core 6.3.1 / @dnd-kit/sortable 10.0.0 |
| テスト | Vitest + React Testing Library |
| Lint / Format | ESLint 10.3.0 + Prettier |

### バックエンド

| 項目 | バージョン |
| --- | --- |
| 言語 | Java 25 |
| フレームワーク | Spring Boot 4.0.3 |
| ビルドツール | Gradle 9.5.0（Kotlin DSL） |
| ORM | Spring Data JPA（Hibernate） |
| 認証 | Spring Security + JWT（jjwt 0.12.6） |
| DB マイグレーション | Flyway |
| テスト | JUnit 5 + Mockito |
| コード品質 | Checkstyle 10.21.4 |

### データベース

| 項目 | 内容 |
| --- | --- |
| DB | PostgreSQL 17 |
| 起動方法 | Docker / docker-compose |

---

## API エンドポイント一覧

### 認証 `/api/auth`

| メソッド | パス | 概要 |
| --- | --- | --- |
| POST | `/api/auth/register` | ユーザー登録（メール / パスワード / ニックネーム） |
| POST | `/api/auth/login` | ログイン → JWT トークン返却 |
| GET | `/api/auth/me` | 現在のユーザー情報取得 |
| PATCH | `/api/auth/me/nickname` | ニックネーム更新 |

### タスク `/api/tasks`

| メソッド | パス | 概要 |
| --- | --- | --- |
| GET | `/api/tasks` | 全タスク取得 |
| POST | `/api/tasks` | タスク作成 |
| GET | `/api/tasks/search?q=` | タスク全文検索 |
| GET | `/api/tasks/completed?titleQ=&descQ=` | 完了タスク検索 |
| GET | `/api/tasks/{id}` | 個別タスク取得 |
| PATCH | `/api/tasks/{id}` | タスク編集 |
| PATCH | `/api/tasks/{id}/status` | ステータス更新（todo / in_progress / done） |
| PATCH | `/api/tasks/{id}/archive` | タスクアーカイブ |
| DELETE | `/api/tasks/{id}` | タスク削除 |

### カラム（タスクリスト）`/api/lists`

| メソッド | パス | 概要 |
| --- | --- | --- |
| GET | `/api/lists` | 全カラム取得 |
| POST | `/api/lists` | カラム作成 |
| PATCH | `/api/lists/reorder` | カラム順序変更 |
| PATCH | `/api/lists/{listId}/tasks/reorder` | カラム内タスク順序変更 |
| DELETE | `/api/lists/{listId}` | カラム削除（タスク残存時・デフォルトカラムは不可） |

---

## リポジトリ構成

```text
TaskManagement/
├── backend/                          # Spring Boot アプリケーション
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/taskmanagement/api/
│   │   │   │   ├── auth/             # 認証（登録・ログイン・JWT）
│   │   │   │   ├── task/             # タスク CRUD
│   │   │   │   ├── list/             # カラム CRUD
│   │   │   │   ├── user/             # ユーザー管理
│   │   │   │   └── security/         # JWT フィルター・Spring Security 設定
│   │   │   └── resources/
│   │   │       ├── application.yml   # DB 接続・JWT 秘密鍵設定
│   │   │       └── db/migration/     # Flyway マイグレーションファイル
│   │   └── test/                     # JUnit 5 テスト
│   ├── docker-compose.yml            # PostgreSQL 起動定義
│   └── build.gradle.kts              # Gradle 依存関係
├── frontend/                         # React + TypeScript アプリケーション
│   └── src/
│       ├── components/
│       │   ├── LoginPage/            # ログイン画面
│       │   ├── RegisterPage/         # ユーザー登録画面
│       │   ├── KanbanBoard/          # メイン画面（DnD ロジック）
│       │   ├── KanbanColumn/         # カラム単位コンポーネント
│       │   ├── TaskCard/             # タスクカード
│       │   ├── TaskCreateModal/      # タスク作成モーダル
│       │   ├── TaskDetailModal/      # タスク詳細・編集モーダル
│       │   ├── CompletedTasksPage/   # 完了タスク一覧画面
│       │   └── Header/               # ヘッダー（ニックネーム・ログアウト）
│       ├── api/                      # API 通信層（authApi.ts / taskApi.ts）
│       ├── hooks/                    # カスタムフック（useAuth / useTasks）
│       ├── types/                    # TypeScript 型定義
│       └── router/                   # 認証ガード（ProtectedRoute）
├── docs/                             # 要件定義・設計ドキュメント
│   ├── requirements.md
│   ├── requirements_phase5.md
│   └── details/
└── CLAUDE.md                         # Claude Code ワークフロールール
```

---

## セットアップ・起動方法

### バックエンド

前提: Docker Desktop が起動していること

```sh
# 1. PostgreSQL を起動
cd backend
docker compose up -d

# 2. アプリを起動（Windows PowerShell）
.\gradlew.bat bootRun

# Mac / Linux
./gradlew bootRun
```

- 起動後、`http://localhost:8080` でアクセス可能
- DB 接続情報（学習用）: DB名・ユーザー・パスワードすべて `taskboard`、ポート `5432`
- 停止: `Ctrl+C`（アプリ）、`docker compose down`（DB）

```sh
# テスト実行（バックエンド）
.\gradlew.bat test
```

### フロントエンド

```sh
cd frontend
npm install
npm run dev
```

- 起動後、`http://localhost:5173` でアクセス可能

```sh
# テスト実行（フロントエンド）
npm run test
```

---

## ドキュメント一覧

| ドキュメント | 内容 |
| --- | --- |
| [要件定義書](docs/requirements.md) | プロジェクト概要・機能要件・非機能要件・技術スタック全体 |
| [フェーズ5 要件（グループ機能）](docs/requirements_phase5.md) | グループ機能の詳細仕様 |
| [業務フロー](docs/details/business-flow.md) | タスク登録〜完了のメイン業務サイクル |
| [ユースケース](docs/details/use-cases.md) | UC-01〜UC-10 の標準形式記述 |
| [画面遷移図](docs/details/screen-transitions.md) | 画面間ナビゲーションフロー |
| [ワイヤーフレーム](docs/details/wireframes.md) | S-01〜S-05 の画面レイアウト |
| [機能 IPO](docs/details/function-ipo.md) | 各機能の入力・処理・出力一覧 |
| [入力チェック仕様](docs/details/input-validation.md) | 画面ごとのバリデーションルール |
| [エラーメッセージ一覧](docs/details/error-messages.md) | エラーコード・メッセージ定義 |
| [データモデル / ER 図](docs/details/data-model.md) | エンティティ定義と ER 図 |
| [システム構成図](docs/details/system-architecture.md) | 3層構成の設計 |
| [改訂履歴](docs/details/revision-history.md) | ドキュメントの変更履歴 |
