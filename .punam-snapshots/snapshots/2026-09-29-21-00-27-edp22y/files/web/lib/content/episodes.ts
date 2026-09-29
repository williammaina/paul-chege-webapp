/**
 * The episode list, baked in.
 *
 * These figures are what the page ships with, so a reader with no server
 * — or a server whose YouTube quota is spent — still sees real numbers
 * rather than a blank section. When the API answers, they are replaced
 * with live ones. The API key never reaches the browser.
 */
export type Episode = {
  id: string;
  cat: "investing" | "business" | "banking" | "insurance" | "kikuyu";
  title: string;
  len: string;
  views: string;
  age: string;
};

export const episodes: Episode[] = [
  { id: "xApF-msZJ6M", cat: "investing", title: "Why Promitto Is Selling Shares (Bank + Mortgage Plan): Smart or Risky?", len: "13:56", views: "19K", age: "11mo ago" },
  { id: "atqQnaseJ3c", cat: "business", title: "Married 11 times, auctioned 5 times, and 10 failed businesses", len: "55:31", views: "4.4K", age: "8mo ago" },
  { id: "rFvz1p1AhBI", cat: "investing", title: "Kenya Pipeline Company IPO: What to know before investing", len: "38:22", views: "3.5K", age: "8mo ago" },
  { id: "Kl-BNPd2Ksg", cat: "business", title: "CEO Podcast · Episode 1: From hawker to millionaire entrepreneur", len: "51:51", views: "2.3K", age: "10mo ago" },
  { id: "Daq2pcruXZg", cat: "kikuyu", title: "EP01 · Ndukagure lorii ya FRR na ũrimũ nĩũgũtahwo", len: "28:05", views: "1.9K", age: "1y ago" },
  { id: "7FFJKnwpEpo", cat: "investing", title: "NCBA Shares Are Skyrocketing — The Truth Behind the Hype", len: "10:59", views: "1.7K", age: "11mo ago" },
  { id: "gJXa44cpn_o", cat: "banking", title: "Mobile Banking Nightmare: Is Your Money Safe?", len: "40:27", views: "1K", age: "4mo ago" },
  { id: "JlPbNG8olcM", cat: "banking", title: "Grace Period or Debt Trap? The Hidden Cost That Can Sink You", len: "23:00", views: "698", age: "8mo ago" },
  { id: "5koeXz9-R8I", cat: "insurance", title: "The health cover that pays YOU the cash instead of the hospital", len: "45:15", views: "418", age: "10mo ago" },
];

export const categories = [
  { key: "all", label: "All episodes" },
  { key: "banking", label: "Banking & Loans" },
  { key: "investing", label: "Investing" },
  { key: "insurance", label: "Insurance" },
  { key: "business", label: "Business" },
  { key: "kikuyu", label: "Kikuyu" },
] as const;
