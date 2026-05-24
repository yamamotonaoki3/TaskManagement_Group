/* ==========================================================
 * TaskBoard プロトタイプ Step 4 - 完了タスク一覧画面（S-05）
 * ----------------------------------------------------------
 * 実装機能：
 *  - F-18 履歴検索（タイトル+説明文 AND 条件）
 *  - 完了日が新しい順で一覧表示
 *  - 行クリックで読み取り専用モーダルを開く
 * ========================================================== */

const SEARCH_KEYWORD_MAX_LENGTH = 50;
const PRIORITY_LABEL = { high: '高', medium: '中', low: '低', '': '（なし）' };

let allCompletedCards = []; // 全完了カード（completedAt順）

// ----------------------------------------------------------
// 全リストから完了済みカードを集約
// ----------------------------------------------------------
function collectCompletedCards() {
  const key = getBoardStorageKey();
  if (!key) return [];
  let parsed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    parsed = JSON.parse(raw);
  } catch (_) { return []; }
  if (!Array.isArray(parsed.lists)) return [];

  const result = [];
  for (const list of parsed.lists) {
    if (!Array.isArray(list.cards)) continue;
    for (const card of list.cards) {
      if (card.completedAt) {
        result.push({
          ...card,
          listName: list.name,
        });
      }
    }
  }
  // 完了日の新しい順
  result.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  return result;
}

// ----------------------------------------------------------
// 表示
// ----------------------------------------------------------
function formatCompletedAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function renderResults(cards) {
  const root = document.getElementById('results');
  root.innerHTML = '';

  if (allCompletedCards.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = '完了タスクはありません'; // I-001
    root.appendChild(empty);
    return;
  }

  if (cards.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = '該当するタスクはありません'; // I-002
    root.appendChild(empty);
    return;
  }

  for (const card of cards) {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.addEventListener('click', () => openReadonlyModal(card));

    // 1行表示：「タイトル：xxx」「説明文：yyy」「完了日：zzz」
    const makeField = (labelText, valueText, valueClass) => {
      const wrapper = document.createElement('span');
      wrapper.className = 'row-field ' + valueClass;
      const label = document.createElement('span');
      label.className = 'row-label';
      label.textContent = labelText;
      const value = document.createElement('span');
      value.className = 'row-value';
      value.textContent = valueText;
      wrapper.appendChild(label);
      wrapper.appendChild(value);
      return wrapper;
    };

    row.appendChild(makeField('タイトル：', card.title || '', 'row-title'));
    row.appendChild(makeField('説明文：',  (card.description || '').replace(/\s+/g, ' ') || '（なし）', 'row-description'));
    row.appendChild(makeField('完了日：',  formatCompletedAt(card.completedAt), 'row-completed'));

    root.appendChild(row);
  }
}

// ----------------------------------------------------------
// 検索
// ----------------------------------------------------------
// 文字列正規化：大文字小文字・全角半角・濁点合成の差を吸収（NFKC + lower）
function normalizeForSearch(s) {
  return (s || '').normalize('NFKC').toLowerCase();
}

// 履歴検索：
//  - タイトル検索欄のワードは「タイトル」のみと照合
//  - 説明文検索欄のワードは「説明文」のみと照合
//  - 各欄内の空白区切りワードはOR、両欄全体もOR
//  - 大文字小文字・全角半角は区別しない
function applySearch() {
  const titleKw = document.getElementById('search-title').value.trim();
  const descKw  = document.getElementById('search-desc').value.trim();
  const errEl   = document.getElementById('search-error');

  errEl.textContent = '';
  if (titleKw.length > SEARCH_KEYWORD_MAX_LENGTH || descKw.length > SEARCH_KEYWORD_MAX_LENGTH) {
    errEl.textContent = '検索キーワードは50文字以内で入力してください'; // E-014
    return;
  }

  const splitWords = s => s.split(/[\s　]+/).filter(Boolean).map(normalizeForSearch);
  const titleWords = splitWords(titleKw);
  const descWords  = splitWords(descKw);

  if (titleWords.length === 0 && descWords.length === 0) {
    renderResults(allCompletedCards);
    return;
  }

  const filtered = allCompletedCards.filter(c => {
    const title = normalizeForSearch(c.title);
    const desc  = normalizeForSearch(c.description);
    const titleMatch = titleWords.length > 0 && titleWords.some(w => title.includes(w));
    const descMatch  = descWords.length > 0  && descWords.some(w => desc.includes(w));
    return titleMatch || descMatch;
  });
  renderResults(filtered);
}

function clearSearch() {
  document.getElementById('search-title').value = '';
  document.getElementById('search-desc').value = '';
  document.getElementById('search-error').textContent = '';
  renderResults(allCompletedCards);
}

// ----------------------------------------------------------
// 読み取り専用モーダル
// ----------------------------------------------------------
function openReadonlyModal(card) {
  document.getElementById('modal-title-input').value = card.title || '';
  document.getElementById('modal-desc-input').value  = card.description || '';
  document.getElementById('modal-priority-display').value = PRIORITY_LABEL[card.priority || ''] || '（なし）';
  document.getElementById('modal-due-input').value   = card.dueDate || '（未設定）';
  document.getElementById('modal-completed-input').value = formatCompletedAt(card.completedAt);
  document.getElementById('card-modal').hidden = false;
}

function closeModal() {
  document.getElementById('card-modal').hidden = true;
}

// ----------------------------------------------------------
// 初期化
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  document.getElementById('header-user-name').textContent = getCurrentUserEmail();

  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    window.location.href = 'login.html';
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('search-btn').addEventListener('click', applySearch);
  document.getElementById('search-clear-btn').addEventListener('click', clearSearch);
  document.getElementById('search-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); applySearch(); }
  });
  document.getElementById('search-desc').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); applySearch(); }
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('card-modal').addEventListener('click', e => {
    if (e.target.id === 'card-modal') closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('card-modal').hidden) closeModal();
  });

  allCompletedCards = collectCompletedCards();
  renderResults(allCompletedCards);
});
