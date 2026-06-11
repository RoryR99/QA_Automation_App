type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

export function sendMethodNotAllowed(req: ApiRequest, res: ApiResponse, allowedMethods: string[]) {
  res.setHeader('Allow', allowedMethods);
  return res.status(405).json({
    message: `Method ${req.method ?? 'UNKNOWN'} Not Allowed`,
  });
}

export function sendError(res: ApiResponse, error: unknown, fallbackMessage = 'Request failed') {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : fallbackMessage;

  return res.status(500).json({ message });
}

export async function readJsonBody<T>(req: ApiRequest): Promise<T> {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }

  return (req.body ?? {}) as T;
}
