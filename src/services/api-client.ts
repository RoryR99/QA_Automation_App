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
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}
