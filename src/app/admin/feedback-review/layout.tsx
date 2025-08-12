import AppLayout from "@/components/app-layout";

export default function AdminFeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
