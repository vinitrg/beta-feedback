import { google } from 'googleapis';
import { Readable } from 'stream';

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google service account credentials not configured');
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function uploadToGoogleDrive(
  file: Buffer,
  fileName: string,
  mimeType: string,
  folder: string
): Promise<string> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('Google Drive folder ID not configured');
  }

  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Create a readable stream from the buffer
  const fileStream = Readable.from(file);

  // Generate a unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uniqueFileName = `${timestamp}_${fileName}`;

  // Create file metadata
  const fileMetadata = {
    name: uniqueFileName,
    parents: [folderId],
    description: `Uploaded from Beta Feedback - ${folder}`,
  };

  // Upload the file (supportsAllDrives for Shared Drives)
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: fileStream,
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  // Make the file viewable by anyone with the link
  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  });

  // Return the web view link
  return response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`;
}

export async function createSubfolder(folderName: string): Promise<string> {
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!parentFolderId) {
    throw new Error('Google Drive folder ID not configured');
  }

  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Check if folder already exists
  const existingFolder = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (existingFolder.data.files && existingFolder.data.files.length > 0) {
    return existingFolder.data.files[0].id!;
  }

  // Create the folder
  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });

  return response.data.id!;
}
