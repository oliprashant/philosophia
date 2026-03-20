import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function EditorContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return <div>Editing post {id}</div>;
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorContent />
    </Suspense>
  );
}