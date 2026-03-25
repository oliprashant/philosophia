'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfileDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleNavigate = async () => {
    setLoading(true);
    console.log('Navigating to /profile...');
    console.log('Current session:', session);
    console.log('Current status:', status);
    
    // Give a slight delay to ensure the log is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    router.push('/profile');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Profile Navigation Debug</h1>
      
      <div className="space-y-4 p-4 border border-gray-300 rounded bg-gray-50">
        <div>
          <p className="font-bold">Session Status: <code className="bg-gray-200 px-2 py-1">{status}</code></p>
        </div>

        <div>
          <p className="font-bold">Session User:</p>
          <pre className="bg-white p-2 border border-gray-200 rounded text-sm overflow-auto">
            {session?.user ? JSON.stringify(session.user, null, 2) : 'No session'}
          </pre>
        </div>

        <div>
          <p className="font-bold">Full Session:</p>
          <pre className="bg-white p-2 border border-gray-200 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {status === 'authenticated' ? (
          <button
            onClick={handleNavigate}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Navigating...' : 'Test /profile Navigation'}
          </button>
        ) : (
          <p className="text-red-600">You are not authenticated. Please sign in first.</p>
        )}
      </div>

      <div className="mt-6 p-4 border border-yellow-300 rounded bg-yellow-50">
        <p className="text-sm text-gray-700">
          <strong>Instructions:</strong> 
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Check your session status and user info above</li>
            <li>If authenticated, click the button to test navigation</li>
            <li>Check the browser console (F12) for logs</li>
            <li>You should be redirected to /profile</li>
          </ol>
        </p>
      </div>
    </div>
  );
}
