import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Check if we're in demo mode
const isDemoMode = !process.env.DATABASE_URL;

// In-memory storage for demo mode
const demoFeedback: Map<string, { experience: string; gaPriority: string; comments: string }> = new Map();

interface FeedbackItem {
  testCaseId: number;
  experience?: string;
  gaPriority?: string;
  comments?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { testerId, feedback } = await request.json() as {
      testerId: number;
      feedback: FeedbackItem[];
    };

    if (!testerId) {
      return NextResponse.json(
        { success: false, error: 'Tester ID is required' },
        { status: 400 }
      );
    }

    if (!feedback || feedback.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No feedback provided' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      // Store in demo mode
      feedback.forEach((f) => {
        const key = `${testerId}-${f.testCaseId}`;
        demoFeedback.set(key, {
          experience: f.experience || '',
          gaPriority: f.gaPriority || '',
          comments: f.comments || '',
        });
      });
      return NextResponse.json({
        success: true,
        message: `Saved ${feedback.length} feedback items (demo mode)`,
      });
    }

    // Insert or update feedback for each test case
    for (const f of feedback) {
      // Only save if there's actual feedback
      if (!f.experience && !f.gaPriority && !f.comments) {
        continue;
      }

      // Check if feedback already exists
      const existing = await sql`
        SELECT id FROM test_feedback
        WHERE tester_id = ${testerId} AND test_case_id = ${f.testCaseId}
      `;

      if (existing.length > 0) {
        // Update existing
        await sql`
          UPDATE test_feedback
          SET experience = ${f.experience || null},
              ga_priority = ${f.gaPriority || null},
              comments = ${f.comments || null}
          WHERE tester_id = ${testerId} AND test_case_id = ${f.testCaseId}
        `;
      } else {
        // Insert new
        await sql`
          INSERT INTO test_feedback (tester_id, test_case_id, experience, ga_priority, comments)
          VALUES (${testerId}, ${f.testCaseId}, ${f.experience || null}, ${f.gaPriority || null}, ${f.comments || null})
        `;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${feedback.length} feedback items`,
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testerId = searchParams.get('testerId');

    if (!testerId) {
      return NextResponse.json(
        { success: false, error: 'Tester ID is required' },
        { status: 400 }
      );
    }

    if (isDemoMode) {
      // Return demo feedback as object
      const feedbackObj: Record<number, { experience: string; gaPriority: string; comments: string }> = {};
      demoFeedback.forEach((value, key) => {
        if (key.startsWith(`${testerId}-`)) {
          const testCaseId = parseInt(key.split('-')[1]);
          feedbackObj[testCaseId] = value;
        }
      });
      return NextResponse.json({ success: true, feedback: feedbackObj });
    }

    const result = await sql`
      SELECT test_case_id, experience, ga_priority, comments
      FROM test_feedback
      WHERE tester_id = ${testerId}
    `;

    // Convert to object keyed by test_case_id
    const feedbackObj: Record<number, { experience: string; gaPriority: string; comments: string }> = {};
    for (const row of result) {
      feedbackObj[row.test_case_id] = {
        experience: row.experience || '',
        gaPriority: row.ga_priority || '',
        comments: row.comments || '',
      };
    }

    return NextResponse.json({ success: true, feedback: feedbackObj });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
