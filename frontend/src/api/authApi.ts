import axios from 'axios';

const TOKEN_KEY = 'jwt_token';

export interface LoginResponse {
  token: string;
}

export interface MeResponse {
  email: string;
  nickname: string;
}

export async function register(email: string, password: string, nickname: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>('http://localhost:8080/api/auth/register', {
    email,
    password,
    nickname,
  });
  return res.data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>('http://localhost:8080/api/auth/login', {
    email,
    password,
  });
  return res.data;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await axios.get<MeResponse>('http://localhost:8080/api/auth/me', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.data;
}

export async function updateNickname(nickname: string): Promise<MeResponse> {
  const res = await axios.patch<MeResponse>(
    'http://localhost:8080/api/auth/me/nickname',
    { nickname },
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  return res.data;
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
