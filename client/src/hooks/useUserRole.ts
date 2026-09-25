import { useState, useEffect } from 'react';

export type UserRole = 'admin' | 'client';

export interface UseUserRoleReturn {
  role: UserRole | null;
  loading: boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRole() {
      try {
        const res = await fetch('/api/admin/me');
        const json = await res.json();
        if (isMounted) {
          if (json?.data?.role === 'admin' || json?.data?.role === 'client') {
            setRole(json.data.role);
          } else {
            setRole('client');
          }
        }
      } catch {
        if (isMounted) {
          setRole('client');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, []);

  return { role, loading };
}
