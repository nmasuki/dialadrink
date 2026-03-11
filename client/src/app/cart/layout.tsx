import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Shopping Cart",
  description: "Review your selected drinks and proceed to checkout. Fast delivery across Nairobi from Dial A Drink Kenya.",
  url: "/cart",
  noindex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
