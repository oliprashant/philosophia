import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Separate component that uses the hook
function EditorContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // Your existing editor UI, using `id`
  return (
    <div>
      <h1>Editor</h1>
      {id && <p>Editing post: {id}</p>}
      {/* rest of your editor code */}
    </div>
  );
}

// Main page component
export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}