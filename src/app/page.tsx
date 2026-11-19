import { redirect } from "next/navigation";
import { DEFAULT_HOME } from "@/config/navigation";

// "/" has no screen of its own: go to Product Management (middleware sends guests to /login first).
export default function HomePage() {
  redirect(DEFAULT_HOME);
}
