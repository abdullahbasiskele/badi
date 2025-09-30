import { Metadata } from "next";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard | Badi Platformu",
};

export default function Page() {
  return <DashboardPage />;
}