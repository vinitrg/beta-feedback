import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Check if we're in demo mode (no database)
const isDemoMode = !process.env.DATABASE_URL;

// Demo mode storage (shared with tester API for consistency)
const demoTesters: Array<{ id: number; session_id: string; email: string; company: string; name: string }> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, company } = body;

    if (!email || !company) {
      return NextResponse.json(
        { success: false, error: 'Email and company name are required' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      // In demo mode, look for matching email (case-insensitive)
      const tester = demoTesters.find(
        (t) => t.email.toLowerCase() === email.toLowerCase()
      );

      if (!tester) {
        return NextResponse.json(
          { success: false, error: 'No account found with this email. Please register as a new participant.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, tester });
    }

    // Look up tester by email (case-insensitive)
    const result = (await sql`
      SELECT id, session_id, email, company, name, project_url, test_platform, language_tested, device_browser, created_at
      FROM testers
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `) as unknown as Record<string, unknown>[];

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email. Please register as a new participant.' },
        { status: 404 }
      );
    }

    const tester = result[0];

    return NextResponse.json({ success: true, tester });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log in. Please try again.' },
      { status: 500 }
    );
  }
}
