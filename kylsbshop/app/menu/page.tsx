import { redirect } from 'next/navigation';

/**
 * The Customer Menu was moved to the root index page (/).
 * Any requests to /menu (with or without ?table=XX) redirect to /.
 */
export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const table = sp?.table;
  if (table) {
    redirect(`/?table=${encodeURIComponent(String(table))}`);
  }
  redirect('/');
}
