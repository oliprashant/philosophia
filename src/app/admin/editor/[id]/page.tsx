import { redirect } from 'next/navigation';

export default function EditEditorRoute({ params }: { params: { id: string } }) {
  redirect(`/admin/editor?id=${params.id}`);
}
