/* ==========================================================
 * TaskBoard プロトタイプ Step 4（フェーズ4：便利機能）
 * ----------------------------------------------------------
 * 実装機能：
 *  - F-01〜F-14（フェーズ1〜3から継続）
 *  - F-15 優先度設定（高／中／低／なし）
 *  - F-16 並び替え（リスト個別・期限／優先度／タイトル／手動）
 *  - F-17 期限警告色（7日前から徐々に赤、1日前で真っ赤、完了列は適用なし）
 *  - F-18 履歴検索：completed-tasks.html へ遷移するボタン
 * ========================================================== */

// ----------------------------------------------------------
// 定数
// ----------------------------------------------------------
const TITLE_MAX_LENGTH = 100;
const DESC_MAX_LENGTH = 2000;
const LIST_NAME_MAX_LENGTH = 30;

const DEFAULT_LISTS = [
  { id: 'list-todo',  name: 'やること', position: 1, sortMode: 'manual', cards: [] },
  { id: 'list-doing', name: '進行中',   position: 2, sortMode: 'manual', cards: [] },
  { id: 'list-done',  name: '完了',     position: 3, sortMode: 'manual', cards: [] },
];

const DONE_LIST_ID = 'list-done';

// 優先度オプション
const PRIORITY_OPTIONS = [
  { value: '',       label: '（なし）', cssClass: '' },
  { value: 'high',   label: '高',       cssClass: 'priority-high' },
  { value: 'medium', label: '中',       cssClass: 'priority-medium' },
  { value: 'low',    label: '低',       cssClass: 'priority-low' },
];

const SORT_OPTIONS = [
  { value: 'manual',   label: '手動' },
  { value: 'dueDate',  label: '期限' },
  { value: 'priority', label: '優先度' },
  { value: 'title',    label: 'タイトル' },
];

const PRIORITY_RANK = { high: 0, medium: 1, low: 2, '': 3 };

// ----------------------------------------------------------
// 状態
// ----------------------------------------------------------
let state = loadState();
let editingCardId = null; // 既存カードを編集中: ID。新規作成: null
let editingListIdForNewCard = null; // 新規作成時の対象リスト
let dragInfo = null; // { type: 'card'|'list', id: ... }

function loadState() {
  const key = getBoardStorageKey();
  if (!key) return { lists: structuredClone(DEFAULT_LISTS) };
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 既存データのマイグレーション（欠損値にデフォルト値）
      if (Array.isArray(parsed.lists)) {
        for (const list of parsed.lists) {
          if (typeof list.sortMode !== 'string') list.sortMode = 'manual';
          if (Array.isArray(list.cards)) {
            for (const card of list.cards) {
              if (typeof card.priority !== 'string') card.priority = '';
            }
          }
        }
      }
      return parsed;
    }
  } catch (_) { /* fallthrough */ }
  return { lists: structuredClone(DEFAULT_LISTS) };
}

function saveState() {
  const key = getBoardStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(state));
}

function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

// ----------------------------------------------------------
// 日付ユーティリティ（フォーマット：YYYY/MM/DD）
// ----------------------------------------------------------
function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function isValidDateStr(s) {
  if (!s) return true; // 空はOK（任意項目）
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(s)) return false;
  const [y, m, day] = s.split('/').map(Number);
  // ECMAScript の Date は YYYY/MM/DD をローカル時刻として解釈してくれる
  const d = new Date(y, m - 1, day);
  if (Number.isNaN(d.getTime())) return false;
  // 入力された値が解釈結果と一致するか（例:2026/02/30 のような不正値を弾く）
  return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

function isPastDate(s) {
  if (!s) return false;
  return s < todayStr();
}

// 数字8桁を YYYY/MM/DD に整形。8桁未満なら部分整形（YYYY/MM や YYYY/）。
// 数字以外はすべて除去する。
function formatDateInput(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + '/' + digits.slice(4);
  return digits.slice(0, 4) + '/' + digits.slice(4, 6) + '/' + digits.slice(6);
}

// 期限警告色の計算（F-17）
// 完了列・期限なしは null（通常背景）
// 7日以上前 → 通常、1日前で真っ赤、間は線形補間
function getDueWarningColor(card, listId) {
  if (listId === DONE_LIST_ID) return null;
  if (!card.dueDate) return null;
  if (!isValidDateStr(card.dueDate)) return null;
  const today = new Date(todayStr().replaceAll('/', '-'));
  const due   = new Date(card.dueDate.replaceAll('/', '-'));
  const daysLeft = Math.round((due - today) / 86400000);
  if (daysLeft >= 7) return null;
  const intensity = Math.min(1, Math.max(0, (7 - daysLeft) / 6));
  // white(255,255,255) → 真っ赤(255,150,150)
  const v = Math.round(255 - 105 * intensity);
  return `rgb(255, ${v}, ${v})`;
}

// ソート済みかつアーカイブ済みを除いたカード配列を返す（F-16）
function getSortedCards(list) {
  const cards = list.cards.filter(c => !c.archived);
  const mode = list.sortMode || 'manual';
  if (mode === 'manual') return cards;

  const sorted = cards.slice();
  if (mode === 'dueDate') {
    sorted.sort((a, b) => {
      const aHas = !!a.dueDate, bHas = !!b.dueDate;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      if (!aHas && !bHas) return 0;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else if (mode === 'priority') {
    sorted.sort((a, b) => {
      const ra = PRIORITY_RANK[a.priority || ''];
      const rb = PRIORITY_RANK[b.priority || ''];
      return ra - rb;
    });
  } else if (mode === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  }
  return sorted;
}

// 期限入力欄に自動整形ハンドラを取り付ける
// カーソル位置の前にある「数字の個数」を維持して、整形後に同じ数字位置にカーソルを置く
function attachDueDateAutoFormat(input) {
  input.addEventListener('input', () => {
    const oldValue = input.value;
    const oldCursor = input.selectionStart ?? oldValue.length;
    // カーソルより前にある数字の個数
    const digitsBefore = oldValue.slice(0, oldCursor).replace(/\D/g, '').length;

    const formatted = formatDateInput(oldValue);
    if (oldValue === formatted) return;

    input.value = formatted;
    // 整形後の文字列で「数字 digitsBefore 個分」の位置にカーソルを置く
    let pos = 0, count = 0;
    for (; pos < formatted.length; pos++) {
      if (count >= digitsBefore) break;
      if (/\d/.test(formatted[pos])) count++;
    }
    input.setSelectionRange(pos, pos);
  });
}

// ----------------------------------------------------------
// 描画
// ----------------------------------------------------------
function render() {
  const root = document.getElementById('kanban');
  root.innerHTML = '';

  state.lists.forEach(list => {
    const column = document.createElement('section');
    column.className = 'list-column';
    column.dataset.listId = list.id;

    column.appendChild(renderListHeader(list, column));

    const body = document.createElement('div');
    body.className = 'list-body';
    body.dataset.listId = list.id;

    const visibleCards = getSortedCards(list);
    if (visibleCards.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = '（カードはありません）';
      body.appendChild(empty);
    } else {
      visibleCards.forEach(card => body.appendChild(renderCard(card, list.id)));
    }

    setupColumnDropTarget(column, list.id);
    column.appendChild(body);

    if (list.id === 'list-todo') {
      column.appendChild(renderAddCardButton(list.id));
    }

    root.appendChild(column);
  });
}

function renderListHeader(list, column) {
  const header = document.createElement('div');
  header.className = 'list-header';
  header.draggable = true;

  const title = document.createElement('span');
  title.className = 'list-header-title';
  title.textContent = list.name;
  header.appendChild(title);

  // 並び替えセレクト（F-16）
  const sortSelect = document.createElement('select');
  sortSelect.className = 'list-sort-select';
  sortSelect.title = '並び替え';
  SORT_OPTIONS.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    sortSelect.appendChild(o);
  });
  sortSelect.value = list.sortMode || 'manual';
  // ヘッダーのドラッグと干渉しないようにする
  sortSelect.addEventListener('mousedown', e => e.stopPropagation());
  sortSelect.addEventListener('click', e => e.stopPropagation());
  sortSelect.addEventListener('change', e => {
    list.sortMode = e.target.value;
    saveState();
    render();
  });
  header.appendChild(sortSelect);

  // 初期3リストは削除不可（業務サイクル維持のため）
  const isInitial = ['list-todo', 'list-doing', 'list-done'].includes(list.id);
  if (!isInitial) {
    const del = document.createElement('button');
    del.className = 'list-delete-btn';
    del.textContent = '×';
    del.title = 'リストを削除';
    del.addEventListener('click', e => {
      e.stopPropagation();
      deleteList(list.id);
    });
    header.appendChild(del);
  }

  // リストヘッダーをドラッグでリスト並び替え
  header.addEventListener('dragstart', e => {
    dragInfo = { type: 'list', id: list.id };
    column.classList.add('list-dragging');
    e.dataTransfer.effectAllowed = 'move';
    // データ転送は仕方なく文字列で（dragInfoが本命）
    e.dataTransfer.setData('text/plain', 'list:' + list.id);
  });
  header.addEventListener('dragend', () => {
    column.classList.remove('list-dragging');
    document.querySelectorAll('.list-column').forEach(c => {
      c.classList.remove('list-drop-before', 'list-drop-after');
    });
    dragInfo = null;
  });

  return header;
}

function renderCard(card, listId) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.cardId = card.id;
  el.dataset.listId = listId;

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = card.title;
  content.appendChild(title);

  // 優先度バッジ（F-15）
  if (card.priority) {
    const priorityOpt = PRIORITY_OPTIONS.find(o => o.value === card.priority);
    if (priorityOpt) {
      const badge = document.createElement('span');
      badge.className = 'priority-badge ' + priorityOpt.cssClass;
      badge.textContent = priorityOpt.label;
      title.prepend(badge);
    }
  }

  if (card.dueDate) {
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const due = document.createElement('span');
    due.className = 'card-due';
    due.textContent = '期限: ' + card.dueDate;
    meta.appendChild(due);
    content.appendChild(meta);
  }

  el.appendChild(content);

  // 期限警告色（F-17）
  const warningColor = getDueWarningColor(card, listId);
  if (warningColor) el.style.backgroundColor = warningColor;

  // カード上の削除ボタン（モーダルを開かずに直接削除）
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const delBtn = document.createElement('button');
  delBtn.className = 'card-btn delete';
  delBtn.textContent = '×';
  delBtn.title = '削除';
  delBtn.addEventListener('click', e => {
    e.stopPropagation(); // カードクリック（モーダル）を抑止
    deleteCard(card.id);
  });
  actions.appendChild(delBtn);
  el.appendChild(actions);

  el.addEventListener('click', () => openCardModal(card.id));

  el.addEventListener('dragstart', e => {
    e.stopPropagation();
    dragInfo = { type: 'card', id: card.id };
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'card:' + card.id);
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    dragInfo = null;
  });

  return el;
}

function renderAddCardButton(listId) {
  const btn = document.createElement('button');
  btn.className = 'add-card-btn';
  btn.textContent = '+ カード追加';
  btn.addEventListener('click', () => openCardModalForNew(listId));
  return btn;
}

// ----------------------------------------------------------
// ドロップターゲット（カード移動 + リスト並び替えの両対応）
// ----------------------------------------------------------
// 指定された list-body の中で、clientY が「何番目の可視カードの直前」に該当するかを返す
// すべてのカードより下なら cards.length（末尾追加）を返す
function computeCardDropIndex(listBody, clientY) {
  const cardEls = [...listBody.querySelectorAll('.card')];
  for (let i = 0; i < cardEls.length; i++) {
    const rect = cardEls[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return cardEls.length;
}

// カードドラッグ中のドロップ位置インジケーター（細い水平線）の表示制御
function clearCardDropIndicators() {
  document.querySelectorAll('.card-drop-indicator').forEach(el => el.remove());
}

function showCardDropIndicator(listBody, dropIndex) {
  clearCardDropIndicators();
  const indicator = document.createElement('div');
  indicator.className = 'card-drop-indicator';
  const cardEls = [...listBody.querySelectorAll('.card')];
  if (dropIndex >= cardEls.length) {
    listBody.appendChild(indicator);
  } else {
    listBody.insertBefore(indicator, cardEls[dropIndex]);
  }
}

function setupColumnDropTarget(column, listId) {
  // listBody はイベント時に取得（render() 中ではまだ append 前のため）
  const getListBody = () => column.querySelector('.list-body');

  column.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!dragInfo) return;

    if (dragInfo.type === 'card') {
      column.classList.add('drag-over');
      // 手動並び替えのときだけ挿入位置インジケーターを出す
      const targetList = state.lists.find(l => l.id === listId);
      const body = getListBody();
      if (body && targetList && (targetList.sortMode || 'manual') === 'manual') {
        const idx = computeCardDropIndex(body, e.clientY);
        showCardDropIndicator(body, idx);
      }
    } else if (dragInfo.type === 'list') {
      if (dragInfo.id === listId) return;
      const rect = column.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      column.classList.toggle('list-drop-before', before);
      column.classList.toggle('list-drop-after', !before);
    }
  });
  column.addEventListener('dragleave', e => {
    if (!column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over', 'list-drop-before', 'list-drop-after');
      clearCardDropIndicators();
    }
  });
  column.addEventListener('drop', e => {
    e.preventDefault();
    column.classList.remove('drag-over', 'list-drop-before', 'list-drop-after');
    clearCardDropIndicators();

    if (!dragInfo) return;

    if (dragInfo.type === 'card') {
      const body = getListBody();
      const dropIndex = body ? computeCardDropIndex(body, e.clientY) : null;
      moveCardTo(dragInfo.id, listId, dropIndex);
    } else if (dragInfo.type === 'list' && dragInfo.id !== listId) {
      const rect = column.getBoundingClientRect();
      const before = e.clientX < rect.left + rect.width / 2;
      reorderList(dragInfo.id, listId, before);
    }
  });
}

// ----------------------------------------------------------
// カード操作
// ----------------------------------------------------------
function moveCardTo(cardId, targetListId, visibleDropIndex) {
  let movingCard = null;
  let sourceList = null;

  for (const list of state.lists) {
    const idx = list.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      sourceList = list;
      [movingCard] = list.cards.splice(idx, 1);
      break;
    }
  }
  if (!movingCard) return;

  const targetList = state.lists.find(l => l.id === targetListId);
  if (!targetList) {
    sourceList.cards.push(movingCard);
    return;
  }

  if (targetListId === DONE_LIST_ID && sourceList.id !== DONE_LIST_ID) {
    movingCard.completedAt = new Date().toISOString();
  }
  if (targetListId !== DONE_LIST_ID && movingCard.completedAt) {
    movingCard.completedAt = null;
  }

  // 手動並び替えの場合のみ任意位置への挿入を許可。ソート中は末尾追加（並びはソートで決まる）
  const isManualSort = (targetList.sortMode || 'manual') === 'manual';
  if (isManualSort && Number.isInteger(visibleDropIndex)) {
    const visibleCards = targetList.cards.filter(c => !c.archived);
    if (visibleDropIndex >= visibleCards.length) {
      targetList.cards.push(movingCard);
    } else {
      const refCard = visibleCards[visibleDropIndex];
      const refIdx = targetList.cards.indexOf(refCard);
      targetList.cards.splice(refIdx, 0, movingCard);
    }
  } else {
    targetList.cards.push(movingCard);
  }
  saveState();
  render();
}

// ----------------------------------------------------------
// リスト操作（F-10 + 並び替え）
// ----------------------------------------------------------
function reorderList(draggedListId, targetListId, insertBefore) {
  const draggedIdx = state.lists.findIndex(l => l.id === draggedListId);
  if (draggedIdx === -1) return;
  const [dragged] = state.lists.splice(draggedIdx, 1);

  let targetIdx = state.lists.findIndex(l => l.id === targetListId);
  if (targetIdx === -1) {
    state.lists.push(dragged);
  } else {
    if (!insertBefore) targetIdx += 1;
    state.lists.splice(targetIdx, 0, dragged);
  }
  reassignPositions();
  saveState();
  render();
}

function deleteList(listId) {
  const list = state.lists.find(l => l.id === listId);
  if (!list) return;
  const visibleCount = list.cards.filter(c => !c.archived).length;
  const msg = visibleCount > 0
    ? `このリストを削除してもよろしいですか？（含まれるカード ${visibleCount} 件も非表示になります）`
    : 'このリストを削除してもよろしいですか？';
  if (!confirm(msg)) return;

  state.lists = state.lists.filter(l => l.id !== listId);
  reassignPositions();
  saveState();
  render();
}

function reassignPositions() {
  state.lists.forEach((l, i) => { l.position = i + 1; });
}

// ----------------------------------------------------------
// リスト追加モーダル
// ----------------------------------------------------------
function openListModal() {
  const select = document.getElementById('list-position-select');
  select.innerHTML = '';

  // オプション：先頭 / 各リストの後
  const addOpt = (value, label) => {
    const opt = document.createElement('option');
    opt.value = String(value);
    opt.textContent = label;
    select.appendChild(opt);
  };
  addOpt(0, '先頭（一番左）');
  state.lists.forEach((l, i) => {
    const isLast = i === state.lists.length - 1;
    addOpt(i + 1, `「${l.name}」の後${isLast ? '（末尾）' : ''}`);
  });

  // デフォルト：「完了」の前 → 完了の直前 = 完了のindex
  const doneIdx = state.lists.findIndex(l => l.id === DONE_LIST_ID);
  if (doneIdx !== -1) select.value = String(doneIdx);
  else select.value = String(state.lists.length);

  document.getElementById('list-name-input').value = '';
  document.getElementById('list-name-error').textContent = '';

  document.getElementById('list-modal').hidden = false;
  setTimeout(() => document.getElementById('list-name-input').focus(), 0);
}

function closeListModal() {
  document.getElementById('list-modal').hidden = true;
}

function saveListModal() {
  const nameEl = document.getElementById('list-name-input');
  const errEl = document.getElementById('list-name-error');
  const name = nameEl.value.trim();

  if (name.length === 0) { errEl.textContent = 'リスト名を入力してください'; return; } // E-012
  if (name.length > LIST_NAME_MAX_LENGTH) { errEl.textContent = 'リスト名は30文字以内で入力してください'; return; } // E-013

  const insertAt = Number(document.getElementById('list-position-select').value);
  const newList = { id: generateId('list'), name, position: 0, cards: [] };
  state.lists.splice(insertAt, 0, newList);
  reassignPositions();
  saveState();
  render();
  closeListModal();
}

// ----------------------------------------------------------
// カード詳細モーダル（新規・編集兼用）
// ----------------------------------------------------------
function openCardModalForNew(listId) {
  editingCardId = null;
  editingListIdForNewCard = listId;

  document.getElementById('modal-title').textContent = 'カードを追加';
  document.getElementById('modal-title-input').value = '';
  document.getElementById('modal-desc-input').value = '';
  document.getElementById('modal-due-input').value = '';
  document.getElementById('modal-priority-input').value = '';
  document.getElementById('modal-delete').style.display = 'none'; // 新規時は削除不要
  clearModalErrors();

  document.getElementById('card-modal').hidden = false;
  setTimeout(() => document.getElementById('modal-title-input').focus(), 0);
}

function openCardModal(cardId) {
  let target = null;
  for (const list of state.lists) {
    const c = list.cards.find(c => c.id === cardId);
    if (c) { target = c; break; }
  }
  if (!target) return;

  editingCardId = cardId;
  editingListIdForNewCard = null;

  document.getElementById('modal-title').textContent = 'カード詳細';
  document.getElementById('modal-title-input').value = target.title;
  document.getElementById('modal-desc-input').value  = target.description || '';
  document.getElementById('modal-due-input').value   = target.dueDate || '';
  document.getElementById('modal-priority-input').value = target.priority || '';
  document.getElementById('modal-delete').style.display = '';
  clearModalErrors();

  document.getElementById('card-modal').hidden = false;
  setTimeout(() => document.getElementById('modal-title-input').focus(), 0);
}

function closeCardModal() {
  document.getElementById('card-modal').hidden = true;
  editingCardId = null;
  editingListIdForNewCard = null;
}

function clearModalErrors() {
  ['modal-title-error', 'modal-desc-error', 'modal-due-error'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

function saveCardModal() {
  const title = document.getElementById('modal-title-input').value.trim();
  const description = document.getElementById('modal-desc-input').value;
  const dueDate = document.getElementById('modal-due-input').value;
  const priority = document.getElementById('modal-priority-input').value;

  clearModalErrors();
  let hasError = false;

  if (title.length === 0) {
    document.getElementById('modal-title-error').textContent = 'タイトルを入力してください'; // E-001
    hasError = true;
  } else if (title.length > TITLE_MAX_LENGTH) {
    document.getElementById('modal-title-error').textContent = 'タイトルは100文字以内で入力してください'; // E-002
    hasError = true;
  }
  if (description.length > DESC_MAX_LENGTH) {
    document.getElementById('modal-desc-error').textContent = '説明文は2000文字以内で入力してください'; // E-003
    hasError = true;
  }
  if (dueDate) {
    if (!isValidDateStr(dueDate)) {
      document.getElementById('modal-due-error').textContent = '正しい日付形式で入力してください'; // E-004
      hasError = true;
    } else if (isPastDate(dueDate)) {
      document.getElementById('modal-due-error').textContent = '期限に過去の日付は指定できません'; // E-020(新規)
      hasError = true;
    }
  }
  if (hasError) return;

  if (editingCardId === null) {
    // 新規作成
    const list = state.lists.find(l => l.id === editingListIdForNewCard);
    if (!list) return;
    list.cards.push({
      id: generateId('card'),
      title,
      description,
      dueDate,
      priority,
      archived: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
  } else {
    // 編集
    for (const list of state.lists) {
      const card = list.cards.find(c => c.id === editingCardId);
      if (card) {
        card.title = title;
        card.description = description;
        card.dueDate = dueDate;
        card.priority = priority;
        break;
      }
    }
  }
  saveState();
  render();
  closeCardModal();
}

// カード一覧上から直接削除する（モーダルを開かない）
function deleteCard(cardId) {
  if (!confirm('このカードを削除してもよろしいですか？')) return; // I-003
  for (const list of state.lists) {
    const card = list.cards.find(c => c.id === cardId);
    if (card) {
      card.archived = true;
      saveState();
      render();
      return;
    }
  }
}

function deleteCardFromModal() {
  if (!editingCardId) return;
  if (!confirm('このカードを削除してもよろしいですか？')) return;
  for (const list of state.lists) {
    const card = list.cards.find(c => c.id === editingCardId);
    if (card) {
      card.archived = true;
      saveState();
      render();
      closeCardModal();
      return;
    }
  }
}

// ----------------------------------------------------------
// 初期化
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 認証チェック（未ログインなら login.html にリダイレクト）
  if (!requireAuth()) return;

  // ヘッダーにユーザー名表示
  const headerUser = document.getElementById('header-user-name');
  if (headerUser) headerUser.textContent = getCurrentUserEmail();

  // ログアウトボタン
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      window.location.href = 'login.html';
    });
  }

  // 認証後にユーザー専用データを読み込んで再描画
  state = loadState();
  render();

  document.getElementById('add-list-btn').addEventListener('click', openListModal);

  // 完了タスク一覧へ遷移（F-18）
  document.getElementById('completed-list-btn').addEventListener('click', () => {
    window.location.href = 'completed-tasks.html';
  });

  // 期限入力欄の自動整形（数字8桁→YYYY/MM/DD）
  attachDueDateAutoFormat(document.getElementById('modal-due-input'));

  // カードモーダル
  document.getElementById('modal-close').addEventListener('click', closeCardModal);
  document.getElementById('modal-cancel').addEventListener('click', closeCardModal);
  document.getElementById('modal-save').addEventListener('click', saveCardModal);
  document.getElementById('modal-delete').addEventListener('click', deleteCardFromModal);
  document.getElementById('card-modal').addEventListener('click', e => {
    if (e.target.id === 'card-modal') closeCardModal();
  });

  // リスト追加モーダル
  document.getElementById('list-modal-close').addEventListener('click', closeListModal);
  document.getElementById('list-modal-cancel').addEventListener('click', closeListModal);
  document.getElementById('list-modal-save').addEventListener('click', saveListModal);
  document.getElementById('list-modal').addEventListener('click', e => {
    if (e.target.id === 'list-modal') closeListModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('card-modal').hidden) closeCardModal();
    else if (!document.getElementById('list-modal').hidden) closeListModal();
  });
});
