import styles from './MemberAvatar.module.css';

const COLORS = [
  '#4a6cf7',
  '#38a169',
  '#e53e3e',
  '#d69e2e',
  '#805ad5',
  '#dd6b20',
  '#319795',
  '#d53f8c',
];

interface Props {
  nickname: string;
  userId: number;
  size?: 'sm' | 'md';
}

export default function MemberAvatar({ nickname, userId, size = 'md' }: Props) {
  const bg = COLORS[userId % COLORS.length];
  const initial = nickname.charAt(0).toUpperCase();

  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: bg }}
      title={nickname}
    >
      {initial}
    </span>
  );
}
