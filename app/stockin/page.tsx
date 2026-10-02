import { redirect } from 'next/navigation';

export default function StockinPage() {
  redirect('/admin?tab=stockin');
}
