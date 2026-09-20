import { redirect } from 'next/navigation';

export default function LegacyProjectPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/overview`);
}
