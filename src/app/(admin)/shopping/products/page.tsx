import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Product Management · Talking Club Admin" };

// Placeholder until the 8.1.0 product list is built.
export default function ProductsPage() {
  return <PageHeader title="Product Management" />;
}
