import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';

// Check if we're in demo mode (no database)
const isDemoMode = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoTesters: Map<string, { id: number; session_id: string; company: string; name: string }> = new Map();
let demoTesterId = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company, name, projectUrl, testPlatform, languageTested, deviceBrowser } = body;

    if (!company || !name || !testPlatform || !languageTested) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sessionId = randomUUID();

    if (isDemoMode) {
      const tester = {
        id: demoTesterId++,
        session_id: sessionId,
        company,
        name,
      };
      demoTesters.set(sessionId, tester);
      return NextResponse.json({ success: true, sessionId });
    }

    await sql`
      INSERT INTO testers (session_id, company, name, project_url, test_platform, language_tested, device_browser)
      VALUES (${sessionId}, ${company}, ${name}, ${projectUrl || null}, ${testPlatform}, ${languageTested}, ${deviceBrowser || null})
    `;

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error creating tester:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save tester information' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      const tester = demoTesters.get(sessionId);
      if (!tester) {
        return NextResponse.json(
          { success: false, error: 'Tester not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, tester });
    }

    const result = (await sql`
      SELECT * FROM testers WHERE session_id = ${sessionId}
    `) as unknown as Record<string, unknown>[];

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tester not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tester: result[0] });
  } catch (error) {
    console.error('Error fetching tester:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tester information' },
      { status: 500 }
    );
  }
}
