import { NextRequest, NextResponse } from 'next/server';
import { runInfrastructureDiscovery } from '@/backend/ai/infrastructure-discovery';
import { adminAuth } from '@/backend/firebase/admin';

async function fetchDoc(projectId: string, collection: string, docId: string, token: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Firestore REST GET failed: ${res.statusText}`);
  }
  return res.json();
}

async function patchDoc(projectId: string, collection: string, docId: string, fields: any, token: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore REST PATCH failed: ${res.status} - ${errText}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Missing or invalid credentials.' },
      { status: 403 }
    );
  }

  const token = authHeader.substring(7).trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'instavibe-app';
  let adminEmail = '';
  let uid = '';

  try {
    // 1. Verify Firebase ID Token via official Admin SDK verifyIdToken method
    const decodedToken = await adminAuth.verifyIdToken(token);
    adminEmail = decodedToken.email || '';
    uid = decodedToken.uid;

    // 2. Validate Admin role/email whitelist
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const isEmailAdmin = adminEmails.includes(adminEmail.toLowerCase());

    // Check roles dataset via REST API using token
    const userDoc = await fetchDoc(projectId, 'users', uid, token);
    const userRole = userDoc?.fields?.role?.stringValue || '';
    const isRoleAdmin = userRole === 'admin';

    if (!isEmailAdmin && !isRoleAdmin) {
      console.warn(`[SECURITY] Blocked non-admin discovery attempt. Email: ${adminEmail}, UID: ${uid}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden: Access requires admin permissions.' },
        { status: 403 }
      );
    }
  } catch (authError: any) {
    console.error('[SECURITY] Verification crashed:', authError);
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Authentication service error.' },
      { status: 403 }
    );
  }

  // 3. Scan Lock & Cooldown check in Firestore using REST API with token
  let lockAcquired = false;

  try {
    const statusData = await fetchDoc(projectId, 'system_settings', 'discovery', token);
    const now = new Date();

    if (statusData && statusData.fields) {
      const isRunning = statusData.fields.isRunning?.booleanValue ?? false;
      const lastScanAtStr = statusData.fields.lastScanAt?.timestampValue || null;
      const lastScanAt = lastScanAtStr ? new Date(lastScanAtStr) : null;

      // Lock Check (isRunning) with 10-minute timeout safety
      if (isRunning === true) {
        const diffMs = now.getTime() - (lastScanAt?.getTime() || 0);
        if (diffMs < 10 * 60 * 1000) {
          return NextResponse.json(
            { success: false, error: 'Discovery already running.' },
            { status: 429 }
          );
        }
      }

      // Cooldown Check (5 minutes)
      if (lastScanAt) {
        const diffMs = now.getTime() - lastScanAt.getTime();
        const cooldownMs = 5 * 60 * 1000;
        if (diffMs < cooldownMs) {
          const nextAvailableSec = Math.ceil((cooldownMs - diffMs) / 1000);
          return NextResponse.json(
            {
              success: false,
              error: 'Please wait before running another scan.',
              nextAvailableSec,
            },
            { status: 429 }
          );
        }
      }
    }

    // 4. Acquire Lock
    await patchDoc(projectId, 'system_settings', 'discovery', {
      isRunning: { booleanValue: true },
      lastScanAt: { timestampValue: new Date().toISOString() }
    }, token);
    lockAcquired = true;

    console.log(`[DISCOVERY] Ingestion starting triggered by Admin: ${adminEmail}`);

    // 5. Trigger Discovery Scan
    const result = await runInfrastructureDiscovery();

    console.log(
      `[DISCOVERY] Ingestion completed. Added: ${result.added}, Skipped: ${result.skipped}, Errors: ${result.errors}`
    );

    return NextResponse.json({
      ...result,
      triggeredBy: adminEmail,
    });
  } catch (error: any) {
    console.error('[DISCOVERY] Scan process crashed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || error,
        logs: [`[ERROR] Discovery scan crashed: ${error.message || error}`],
      },
      { status: 500 }
    );
  } finally {
    if (lockAcquired) {
      // 6. Release lock, store last scan timestamp
      try {
        await patchDoc(projectId, 'system_settings', 'discovery', {
          isRunning: { booleanValue: false },
          lastScanAt: { timestampValue: new Date().toISOString() }
        }, token);
        console.log('[DISCOVERY] Lock released.');
      } catch (releaseError) {
        console.error('[DISCOVERY] Failed to release lock:', releaseError);
      }
    }
  }
}
