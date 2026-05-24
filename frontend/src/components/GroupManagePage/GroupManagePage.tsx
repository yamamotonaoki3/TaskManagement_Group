import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchGroupMembers, inviteMember } from '../../api/groupApi';
import { fetchMyGroups } from '../../api/groupApi';
import type { GroupMemberResponse, GroupResponse } from '../../types/task';
import { Header } from '../Header/Header';
import styles from './GroupManagePage.module.css';

export function GroupManagePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupResponse | null>(null);
  const [members, setMembers] = useState<GroupMemberResponse[]>([]);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    fetchMyGroups().then((groups) => {
      const found = groups.find((g) => g.id === Number(groupId));
      setGroup(found ?? null);
    });
    fetchGroupMembers(Number(groupId)).then(setMembers).catch(() => {});
  }, [groupId]);

  const handleInvite = async () => {
    if (!email.trim() || !groupId) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const newMember = await inviteMember(Number(groupId), email.trim());
      setMembers((prev) => [...prev, newMember]);
      setEmail('');
      setInviteSuccess(`${newMember.nickname}（${newMember.email}）を招待しました`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '招待に失敗しました';
      setInviteError(msg);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.main}>
        <button className={styles.back} onClick={() => navigate('/')}>← ボードに戻る</button>
        <h2 className={styles.title}>{group?.name ?? 'グループ管理'}</h2>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>メンバー招待</h3>
          <div className={styles.inviteRow}>
            <input
              type="email"
              className={styles.input}
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
            />
            <button
              className={styles.inviteButton}
              onClick={handleInvite}
              disabled={!email.trim() || inviting}
            >
              {inviting ? '招待中...' : '招待する'}
            </button>
          </div>
          {inviteError && <p className={styles.error}>{inviteError}</p>}
          {inviteSuccess && <p className={styles.success}>{inviteSuccess}</p>}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>メンバー一覧</h3>
          {members.length === 0 ? (
            <p className={styles.empty}>メンバーがいません</p>
          ) : (
            <ul className={styles.memberList}>
              {members.map((m) => (
                <li key={m.id} className={styles.memberItem}>
                  <span className={styles.nickname}>{m.nickname}</span>
                  <span className={styles.memberEmail}>{m.email}</span>
                  {m.userId === group?.ownerUserId && (
                    <span className={styles.ownerBadge}>リーダー</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
