# TaskManagement — Claude Code ワークフロールール

## 絶対に守るルール

1. **作業は必ずイシューから始める**
   - コード変更・機能追加・バグ修正・ドキュメント更新、いかなる作業も GitHub Issue を先に作成する。
   - Issue なしにブランチを切ってはいけない。

2. **main ブランチへの直接プッシュ禁止**
   - `git push origin main` は禁止。GitHub 側でも強制されている。
   - 必ず作業ブランチから PR を作成し、マージで取り込む。

3. **PR はレビュー・動作確認後にマージする**
   - 自分でセルフレビューを行い、チェックリストを埋めてからマージする。
   - CI（整備後）が通っていることを確認する。

---

## ブランチ命名規則

```
<prefix>/#<issue番号>-<英語の概要>
```

| プレフィックス | 用途 |
|---|---|
| `feature` | 機能追加 |
| `fix` | 不具合修正 |
| `chore` | リファクタ・設定変更・依存更新 |
| `docs` | ドキュメントのみの変更 |

**例:**
- `feature/#12-add-card-entity`
- `fix/#34-task-not-saving`
- `chore/#7-update-gradle-wrapper`
- `docs/#2-add-api-spec`

---

## 作業フロー（毎回この順番で）

```
1. GitHub で Issue を作成（テンプレートを使う）
2. ブランチを切る: git checkout -b feature/#<番号>-<概要>
3. 実装・コミット
4. git push origin <ブランチ名>
5. GitHub で PR を作成（テンプレートを使う・Closes #<番号> を記載）
6. セルフレビュー → マージ
7. ブランチ削除
```

---

## コミットメッセージ規則

```
<種別>: <変更内容の要約>（日本語可）

例:
feat: カードエンティティを追加
fix: タスク保存時のNullPointerExceptionを修正
chore: Gradle Wrapper を 9.5.0 に更新
docs: API 仕様書を追加
```

---

## 技術スタック（参考）

- **Backend:** Java 25 / Spring Boot 4.0.3 / Gradle 9.5.0 (Kotlin DSL) / PostgreSQL 17
- **Frontend:** React 19.2.6 / TypeScript 6.0.2 / Vite 8.0.12
- **パッケージ:** `com.taskmanagement.api`
- **DB 起動:** `cd backend && docker compose up -d`
- **アプリ起動:** `cd backend && .\gradlew.bat bootRun`
