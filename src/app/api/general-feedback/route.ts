import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Check if we're in demo mode (no database)
const isDemoMode = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoGeneralFeedback: Array<{
  id: number;
  tester_id: number;
  category: string;
  priority: string;
  description: string;
  media_urls: string[];
  created_at: Date;
}> = [];
let feedbackIdCounter = 1;

export async function POST(request: NextRequest) {
  try {
    const { testerId, category, priority, description, mediaUrls } = await request.json();

    if (!testerId || !category || !priority || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      demoGeneralFeedback.push({
        id: feedbackIdCounter++,
        tester_id: testerId,
        category,
        priority,
        description,
        media_urls: mediaUrls || [],
        created_at: new Date(),
      });
      return NextResponse.json({ success: true });
    }

    await sql`
      INSERT INTO general_feedback (tester_id, category, priority, description, media_urls)
      VALUES (${testerId}, ${category}, ${priority}, ${description}, ${mediaUrls || []})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving general feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (isDemoMode) {
      return NextResponse.json({ success: true, feedback: demoGeneralFeedback });
    }

    const result = await sql`
      SELECT
        gf.*,
        t.name as tester_name,
        t.company as tester_company
      FROM general_feedback gf
      JOIN testers t ON gf.tester_id = t.id
      ORDER BY gf.created_at DESC
    `;

    return NextResponse.json({ success: true, feedback: result });
  } catch (error) {
    console.error('Error fetching general feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
