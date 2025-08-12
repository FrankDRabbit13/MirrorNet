import AppLayout from "@/components/app-layout";

export default function AdminUserManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
