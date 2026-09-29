export type Payee = {
  name: string; shortcode: string | null; type: "paybill" | "till";
  phone: string; email: string; location: string; licence: string | null;
};
export type Slot = { time: string; available: boolean; past: boolean };
export type Day = { date: string; weekday: string; slots: Slot[]; open: boolean };
export type Session = { key: string; label: string; minutes: number; price: number; blurb: string };
export type Booking = {
  ref: string; type: string; session: string; minutes: number; date: string; time: string;
  startsAt: string; amount: number; status: string; receipt: string | null;
  holdExpires: number | null; icsUrl: string | null; meetLink: string | null;
  meetState: string | null; emailedTo: string | null;
};
export type OrderStatus = {
  orderId: string; status: string; message?: string; receipt?: string | null;
  amount: number; digital: boolean; physical: boolean;
  downloadUrl?: string | null; filename?: string | null; booking?: Booking | null;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  // The server writes messages meant to be read by the buyer, so its text
  // is what surfaces rather than a status code.
  if (!res.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
  return body as T;
}

export const api = {
  slots: () => call<{ days: Day[]; sessions: Record<string, Session>; payee: Payee }>("/api/slots"),
  hold: (b: { type: string; date: string; time: string }) =>
    call<{ booking: Booking; payee: Payee; holdMinutes: number }>("/api/booking/hold", {
      method: "POST", body: JSON.stringify(b),
    }),
  confirmFree: (b: { bookingRef: string; name: string; phone: string; email?: string; note?: string }) =>
    call<{ booking: Booking }>("/api/booking/confirm", { method: "POST", body: JSON.stringify(b) }),
  checkout: (b: Record<string, unknown>) =>
    call<{ orderId: string; amount: number; digital: boolean; demo: boolean; payee: Payee; bookingRef: string | null; message: string }>(
      "/api/checkout", { method: "POST", body: JSON.stringify(b) }),
  order: (id: string) => call<OrderStatus>(`/api/order/${id}`),
};

export const money = (n: number) => "KES " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
