/* ==========================================================
 * TaskBoard プロトタイプ Step 3（フェーズ3：認証）
 * ----------------------------------------------------------
 * 認証ロジック（モック実装）
 *
 * プロトタイプの割り切り：
 *  - パスワードは btoa(salt+pw) の軽いエンコードのみ。本実装では bcrypt 等の
 *    一方向ハッシュを使用する（要件定義書 6.5 セキュリティ準拠）。
 *  - セッションは localStorage に保存。本実装では HttpOnly Cookie +
 *    サーバー側セッション検証を行う。
 *  - メール認証や2段階認証はスコープ外。
 * ========================================================== */

const AUTH_USERS_KEY   = 'taskboard-users';
const AUTH_SESSION_KEY = 'taskboard-session';
const PW_SALT          = 'taskboard-prototype-salt-v1';

const EMAIL_MAX_LENGTH = 256;
const PW_MIN_LENGTH = 8;
const PW_MAX_LENGTH = 64;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_HAS_LETTER_REGEX = /[A-Za-z]/;
const PW_HAS_DIGIT_REGEX  = /[0-9]/;

// ----------------------------------------------------------
// ストレージアクセス
// ----------------------------------------------------------
function getUsers() {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function setUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem(AUTH_SESSION_KEY);
}

function setSession(email) {
  localStorage.setItem(AUTH_SESSION_KEY, email);
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getCurrentUserEmail() {
  return getSession();
}

function getBoardStorageKey() {
  const email = getSession();
  if (!email) return null;
  return 'taskboard-data-' + email;
}

// ----------------------------------------------------------
// パスワード処理（プロト用：btoa+salt）
// ----------------------------------------------------------
function hashPassword(pw) {
  // btoa はマルチバイト未対応のため、UTF-8 にエンコードしてから処理
  const utf8 = unescape(encodeURIComponent(PW_SALT + pw));
  return btoa(utf8);
}

// ----------------------------------------------------------
// 入力検証
// ----------------------------------------------------------
// 戻り値：エラーコード（'E-XXX'）または null（OK）

function validateEmailRequired(email) {
  if (!email || email.trim().length === 0) return 'E-005';
  return null;
}

function validateEmailFormat(email) {
  if (!EMAIL_REGEX.test(email)) return 'E-006';
  if (email.length > EMAIL_MAX_LENGTH) return 'E-006';
  return null;
}

function validatePasswordRequired(pw) {
  if (!pw || pw.length === 0) return 'E-007';
  return null;
}

function validatePasswordStrength(pw) {
  if (pw.length < PW_MIN_LENGTH || pw.length > PW_MAX_LENGTH) return 'E-008';
  if (!PW_HAS_LETTER_REGEX.test(pw) || !PW_HAS_DIGIT_REGEX.test(pw)) return 'E-009';
  return null;
}

function validatePasswordConfirmRequired(confirm) {
  if (!confirm || confirm.length === 0) return 'E-010';
  return null;
}

function validatePasswordMatch(pw, confirm) {
  if (pw !== confirm) return 'E-011';
  return null;
}

// ----------------------------------------------------------
// エラーメッセージ対応表（要件定義書 5.8）
// ----------------------------------------------------------
const ERROR_MESSAGES = {
  'E-005': 'メールアドレスを入力してください',
  'E-006': 'メールアドレスの形式が正しくありません',
  'E-007': 'パスワードを入力してください',
  'E-008': 'パスワードは8文字以上64文字以内で入力してください',
  'E-009': 'パスワードは英字と数字を含めてください',
  'E-010': '確認用パスワードを入力してください',
  'E-011': 'パスワードが一致しません',
  'E-101': 'このメールアドレスは既に登録されています',
  'E-102': 'メールアドレスまたはパスワードが正しくありません',
};

function errorMessage(code) {
  return ERROR_MESSAGES[code] || '不明なエラーが発生しました';
}

// ----------------------------------------------------------
// 登録・認証
// ----------------------------------------------------------
// register: 成功時 null、失敗時エラーコード（'E-XXX'）を返す
function register(email, pw, pwConfirm) {
  const e1 = validateEmailRequired(email);     if (e1) return e1;
  const e2 = validateEmailFormat(email.trim());if (e2) return e2;
  const e3 = validatePasswordRequired(pw);     if (e3) return e3;
  const e4 = validatePasswordStrength(pw);     if (e4) return e4;
  const e5 = validatePasswordConfirmRequired(pwConfirm); if (e5) return e5;
  const e6 = validatePasswordMatch(pw, pwConfirm);       if (e6) return e6;

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some(u => u.email === normalizedEmail)) return 'E-101';

  users.push({
    email: normalizedEmail,
    passwordHash: hashPassword(pw),
    createdAt: new Date().toISOString(),
  });
  setUsers(users);
  return null;
}

// login: 成功時 null、失敗時エラーコード
function login(email, pw) {
  const e1 = validateEmailRequired(email);     if (e1) return e1;
  const e2 = validateEmailFormat(email.trim());if (e2) return e2;
  const e3 = validatePasswordRequired(pw);     if (e3) return e3;

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email === normalizedEmail);
  if (!user) return 'E-102';
  if (user.passwordHash !== hashPassword(pw)) return 'E-102';

  setSession(normalizedEmail);
  return null;
}

function logout() {
  clearSession();
}

// ----------------------------------------------------------
// 認証ガード（ボード画面で使用）
// ----------------------------------------------------------
function requireAuth() {
  if (!getSession()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
