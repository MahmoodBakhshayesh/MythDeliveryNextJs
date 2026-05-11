import { redirect } from "next/navigation";

/** @deprecated Old path — fleet plan history lives under `/driver/history`. */
export default function DriverPlansRedirectPage() {
  redirect("/driver/history");
}
