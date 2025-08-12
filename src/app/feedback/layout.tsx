import AppLayout from "@/components/app-layout";

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
