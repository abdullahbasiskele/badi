import { Metadata } from "next";
import { AdminPanelPage } from "@/features/dashboard/pages/admin-panel-page";

export const metadata: Metadata = {
  title: "Yönetim Paneli | Badi Platformu",
};

export default function Page() {
  return <AdminPanelPage />;
}