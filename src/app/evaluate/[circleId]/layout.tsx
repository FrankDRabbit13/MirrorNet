import AppLayout from "@/components/app-layout";

export default function EvaluateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
