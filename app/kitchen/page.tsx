import { redirect } from 'next/navigation';

/**
 * The kitchen display system was refactored into the Cashier POS Order Acceptance Terminal.
 * Redirect any traffic to /pos.
 */
export default function KitchenPage() {
  redirect('/pos');
}
