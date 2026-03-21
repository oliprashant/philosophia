import { auth } from '@/lib/auth';

export default async function DebugPage() {
  const session = await auth();
  return (
    <pre style={{ padding: 40 }}>
      {JSON.stringify(session, null, 2)}
    </pre>
  );
}
