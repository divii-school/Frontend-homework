import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/app-routes';

/** "/" has no screen of its own; middleware normally redirects first. */
export default function Home() {
  redirect(ROUTES.home);
}
