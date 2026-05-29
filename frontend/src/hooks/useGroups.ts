import { useCallback, useEffect, useState } from 'react';

import { createGroup, deleteGroup, fetchGroupMembers, fetchMyGroups, inviteMember } from '../api/groupApi';
import type { GroupMemberResponse, GroupResponse } from '../types/task';

export function useGroups() {
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMyGroups();
      setGroups(data);
    } catch {
      setError('グループの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyGroups()
      .then(setGroups)
      .catch(() => setError('グループの読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const addGroup = useCallback(async (name: string): Promise<GroupResponse> => {
    const created = await createGroup(name);
    setGroups((prev) => [...prev, created]);
    return created;
  }, []);

  const getMembers = useCallback(
    (groupId: number): Promise<GroupMemberResponse[]> => fetchGroupMembers(groupId),
    [],
  );

  const invite = useCallback(
    (groupId: number, email: string): Promise<GroupMemberResponse> =>
      inviteMember(groupId, email),
    [],
  );

  const removeGroup = useCallback(async (groupId: number): Promise<void> => {
    await deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  return { groups, loading, error, addGroup, getMembers, invite, removeGroup, reload: load };
}
