import type { Payee } from "@/lib/api";
import { money } from "@/lib/api";

/**
 * What a buyer checks on their own handset before typing a PIN.
 *
 * This is the single most useful thing you can give a Kenyan buyer to tell
 * a real business from a scam: the exact amount, the exact paybill, and
 * the exact registered name that will appear — stated *before* the prompt,
 * with instructions to cancel if any of it differs.
 */
export function Assurance({ amount, payee }: { amount: number; payee: Payee | null }) {
  const code = payee?.shortcode
    ? <> to {payee.type === "till" ? "till" : "paybill"} <b>{payee.shortcode}</b></>
    : null;

  return (
    <div className="mt-3.5 rounded-[13px] border border-[#e4e9ee] p-4">
      <h4 className="text-[.7rem] font-extrabold uppercase tracking-[.12em] text-[#6b7784]">
        Before you pay — check these
      </h4>
      <ul className="mt-2.5 space-y-2.5">
        <Item>
          The prompt will ask for <b>{money(amount)}</b>{code}, and will name{" "}
          <b>{payee?.name || "Bizsure Insurance Brokers"}</b>. If it says any other name
          or amount, cancel it and call us.
        </Item>
        <Item>
          You enter your PIN on your own handset, never on this page.{" "}
          <b>Nobody here will ever ask you for your M-Pesa PIN.</b>
        </Item>
        <Item>
          A licensed insurance broker, at {payee?.location || "Ciata City Mall, Ridgeways, Nairobi"}.
        </Item>
      </ul>
      <p className="mt-3 rounded-[10px] bg-[rgba(0,166,81,.08)] px-3.5 py-2.5 text-[.82rem] leading-relaxed text-[#2c4a38]">
        If the money leaves your account and you do not get what you paid for, call{" "}
        <b>{payee?.phone || "+254 710 890 994"}</b> with your M-Pesa message and it is
        refunded in full.
      </p>
    </div>
  );
}

const Item = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2.5 text-[.83rem] leading-relaxed text-[#3c4a5a]">
    <span className="shrink-0 font-bold text-mpesa">●</span>
    <span>{children}</span>
  </li>
);
