import { NextRequest, NextResponse } from 'next/server';
import { uploadToGoogleDrive } from '@/lib/google-drive';

// Check if we're in demo mode (no database)
const isDemoMode = !process.env.DATABASE_URL;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (30MB max)
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 30MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Demo mode - return a placeholder URL
    if (isDemoMode) {
      const demoUrl = `https://drive.google.com/demo/${Date.now()}_${file.name}`;
      return NextResponse.json({ success: true, url: demoUrl });
    }

    // Check if Google Drive is configured
    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      // Return a placeholder URL if not configured
      const placeholderUrl = `https://placeholder.local/${Date.now()}_${file.name}`;
      return NextResponse.json({ success: true, url: placeholderUrl });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Drive
    const url = await uploadToGoogleDrive(buffer, file.name, file.type, folder);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
