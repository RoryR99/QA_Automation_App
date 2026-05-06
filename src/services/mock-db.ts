const STORAGE_KEYS = {
  inspections: 'qa-auto-project:inspections',
  inspectionExtensions: 'qa-auto-project:inspection-extensions',
  closureMeasurements: 'qa-auto-project:closure-measurements',
  runs: 'qa-auto-project:runs',
};

export function wait(ms = 450) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export const mockDb = {
  inspections: {
    read: <T,>() => readStorage<T[]>(STORAGE_KEYS.inspections, []),
    write: <T,>(value: T[]) => writeStorage(STORAGE_KEYS.inspections, value),
  },
  inspectionExtensions: {
    read: <T,>() => readStorage<T[]>(STORAGE_KEYS.inspectionExtensions, []),
    write: <T,>(value: T[]) => writeStorage(STORAGE_KEYS.inspectionExtensions, value),
  },
  closureMeasurements: {
    read: <T,>() => readStorage<T[]>(STORAGE_KEYS.closureMeasurements, []),
    write: <T,>(value: T[]) => writeStorage(STORAGE_KEYS.closureMeasurements, value),
  },
  runs: {
    read: <T,>() => readStorage<T[]>(STORAGE_KEYS.runs, []),
    write: <T,>(value: T[]) => writeStorage(STORAGE_KEYS.runs, value),
  },
};
