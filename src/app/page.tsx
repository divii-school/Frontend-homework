import { redirect } from "next/navigation";
import { DEFAULT_AFTER_LOGIN } from "@/lib/auth/redirect";

// "/" goes to the main admin page; the route guard sends logged-out users to /login.
export default function Home() {
  redirect(DEFAULT_AFTER_LOGIN);
}
