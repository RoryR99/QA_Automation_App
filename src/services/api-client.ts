import { supabase } from '@/lib/supabase';

async function parseError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}
