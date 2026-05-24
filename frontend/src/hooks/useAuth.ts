import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { fetchMe, getToken, removeToken, updateNickname as updateNicknameApi } from '../api/authApi';

export function useAuth() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    if (getToken()) {
      fetchMe()
        .then((me) => setNickname(me.nickname))
        .catch(() => setNickname(''));
    }
  }, []);

  function logout() {
    removeToken();
    setNickname('');
    navigate('/login');
  }

  function isAuthenticated(): boolean {
    return getToken() !== null;
  }

  async function updateNickname(newNickname: string): Promise<void> {
    const me = await updateNicknameApi(newNickname);
    setNickname(me.nickname);
  }

  return { logout, isAuthenticated, nickname, updateNickname };
}
