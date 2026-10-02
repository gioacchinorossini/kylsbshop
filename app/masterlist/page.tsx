import { redirect } from 'next/navigation';

export default function MasterlistPage() {
  redirect('/admin?tab=products');
}
