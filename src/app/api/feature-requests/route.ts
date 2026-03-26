import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Check if we're in demo mode (no database)
const isDemoMode = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoFeatureRequests: Array<{
  id: number;
  tester_id: number;
  title: string;
  description: string;
  priority: string;
  use_case: string;
  media_urls: string[];
  created_at: Date;
}> = [];
let requestIdCounter = 1;

export async function POST(request: NextRequest) {
  try {
    const { testerId, title, description, priority, useCase, mediaUrls } = await request.json();

    if (!testerId || !title || !description || !priority || !useCase) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      demoFeatureRequests.push({
        id: requestIdCounter++,
        tester_id: testerId,
        title,
        description,
        priority,
        use_case: useCase,
        media_urls: mediaUrls || [],
        created_at: new Date(),
      });
      return NextResponse.json({ success: true });
    }

    await sql`
      INSERT INTO feature_requests (tester_id, title, description, priority, use_case, media_urls)
      VALUES (${testerId}, ${title}, ${description}, ${priority}, ${useCase}, ${mediaUrls || []})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving feature request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save feature request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (isDemoMode) {
      return NextResponse.json({ success: true, requests: demoFeatureRequests });
    }

    const result = await sql`
      SELECT
        fr.*,
        t.name as tester_name,
        t.company as tester_company
      FROM feature_requests fr
      JOIN testers t ON fr.tester_id = t.id
      ORDER BY fr.created_at DESC
    `;

    return NextResponse.json({ success: true, requests: result });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feature requests' },
      { status: 500 }
    );
  }
}
