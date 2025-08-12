import AppLayout from "@/components/app-layout";

export default function InvitesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
