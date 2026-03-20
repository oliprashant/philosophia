import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Editor = dynamic(() => import('./EditorClient'), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Editor />
    </Suspense>
  );
}