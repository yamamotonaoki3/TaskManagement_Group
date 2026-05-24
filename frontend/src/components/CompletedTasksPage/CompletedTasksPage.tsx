import { useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchCompletedTasks, permanentlyDeleteTask,updateTask } from '../../api/taskApi';
import { useAuth } from '../../hooks/useAuth';
import type { TaskResponse, TaskUpdateRequest } from '../../types/task';
import { TaskDetailModal } from '../TaskDetailModal/TaskDetailModal';
import styles from './CompletedTasksPage.module.css';

export function CompletedTasksPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [titleQ, setTitleQ] = useState('');
  const [descQ, setDescQ] = useState('');
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await fetchCompletedTasks('', '');
        setTasks(result);
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const result = await fetchCompletedTasks(titleQ, descQ);
      setTasks(result);
      setError(null);
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number, data: TaskUpdateRequest) => {
    await updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    setSelectedTask(null);
  };

  const handleDelete = async (id: number) => {
    await permanentlyDeleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>完了タスク一覧</h1>
        <button className={styles.logoutButton} onClick={logout}>
          ログアウト
        </button>
      </header>

      <div className={styles.searchArea}>
        <label className={styles.searchLabel}>
          タイトル
          <input
            className={styles.searchInput}
            type="text"
            value={titleQ}
            onChange={(e) => setTitleQ(e.target.value)}
            placeholder="キーワードで絞り込み"
            maxLength={50}
          />
        </label>
        <label className={styles.searchLabel}>
          説明文
          <input
            className={styles.searchInput}
            type="text"
            value={descQ}
            onChange={(e) => setDescQ(e.target.value)}
            placeholder="キーワードで絞り込み"
            maxLength={50}
          />
        </label>
        <button className={styles.searchButton} onClick={handleSearch} disabled={loading}>
          {loading ? '検索中...' : '検索'}
        </button>
      </div>

      <main className={styles.main}>
        {error && <p className={styles.error}>{error}</p>}
        {loading && <p className={styles.hint}>読み込み中...</p>}
        {!loading && tasks.length === 0 && (
          <p className={styles.hint}>
            {hasSearched ? '該当するタスクはありません' : '完了タスクはありません'}
          </p>
        )}
        {tasks.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>完了日</th>
                <th className={styles.th}>タイトル</th>
                <th className={styles.th}>説明文</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className={styles.row} onClick={() => setSelectedTask(task)}>
                  <td className={`${styles.td} ${styles.dateCell}`}>{formatDate(task.completedAt)}</td>
                  <td className={styles.td}>{task.title}</td>
                  <td className={`${styles.td} ${styles.descCell}`}>
                    <div className={styles.descInner}>{task.description ?? ''}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer className={styles.footer}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ボードに戻る
        </button>
      </footer>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
