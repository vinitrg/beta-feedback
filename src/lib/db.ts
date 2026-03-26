import { neon } from '@neondatabase/serverless';

// Lazy initialization to avoid build-time errors when DATABASE_URL is not set
function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
}

// Export a function that creates the SQL client on demand
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  if (!client) {
    client = getDb();
  }
  return client(strings, ...values);
};

// Helper types for database operations
export type Tester = {
  id: number;
  session_id: string;
  email: string | null;
  company: string;
  name: string;
  project_url: string;
  test_platform: string;
  language_tested: string;
  device_browser: string;
  created_at: Date;
};

export type TestCase = {
  id: number;
  category: string;
  subcategory: string;
  test_step: string;
  system_behaviour: string;
  sheet_row_index: number;
  created_at: Date;
  updated_at: Date;
};

export type TestFeedback = {
  id: number;
  tester_id: number;
  test_case_id: number;
  experience: string;
  ga_priority: string;
  comments: string;
  created_at: Date;
};

export type GeneralFeedback = {
  id: number;
  tester_id: number;
  category: string;
  priority: string;
  description: string;
  media_urls: string[];
  created_at: Date;
};

export type FeatureRequest = {
  id: number;
  tester_id: number;
  title: string;
  description: string;
  priority: string;
  use_case: string;
  media_urls: string[];
  created_at: Date;
};
