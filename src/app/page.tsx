import { redirect } from "next/navigation";

// Entry point. The auth layer (to be built) sends logged-out users to /login.
export default function Home() {
  redirect("/login");
}
