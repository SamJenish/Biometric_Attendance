import { redirect } from 'next/navigation';

export default function Home() {
  // Simple entry point - redirect to login
  redirect('/login');
}
