export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error ?? `Error ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export function formatCurrency(value: string | number) {
  return `Bs ${Number(value).toFixed(2)}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
