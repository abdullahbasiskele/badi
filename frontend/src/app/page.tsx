import { Metadata } from "next";
import { HomePage } from "@/features/site/pages/home-page";

export const metadata: Metadata = {
  title: "Ana Sayfa | Badi Platformu",
};

export default function Page() {
  return <HomePage />;
}