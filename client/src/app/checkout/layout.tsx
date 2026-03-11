import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your order with Dial A Drink Kenya. Secure payment and fast delivery across Nairobi.",
  url: "/checkout",
  noindex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
