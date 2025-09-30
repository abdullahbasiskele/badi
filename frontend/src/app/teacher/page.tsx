import { Metadata } from "next";
import { TeacherPanelPage } from "@/features/dashboard/pages/teacher-panel-page";

export const metadata: Metadata = {
  title: "Öğretmen Paneli | Badi Platformu",
};

export default function Page() {
  return <TeacherPanelPage />;
}