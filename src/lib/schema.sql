-- Tester Sessions (stores tester info once)
CREATE TABLE IF NOT EXISTS testers (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  company VARCHAR(255),
  name VARCHAR(255),
  project_url TEXT,
  test_platform VARCHAR(100),
  language_tested VARCHAR(50),
  device_browser TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test Cases (synced from Google Sheets)
CREATE TABLE IF NOT EXISTS test_cases (
  id SERIAL PRIMARY KEY,
  sheet_name VARCHAR(255),
  category VARCHAR(255),
  subcategory VARCHAR(255),
  test_step TEXT,
  system_behaviour TEXT,
  sheet_row_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Test Case Feedback
CREATE TABLE IF NOT EXISTS test_feedback (
  id SERIAL PRIMARY KEY,
  tester_id INTEGER REFERENCES testers(id) ON DELETE CASCADE,
  test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
  experience VARCHAR(50),
  ga_priority VARCHAR(50),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_cases_category ON test_cases(category);
CREATE INDEX IF NOT EXISTS idx_test_feedback_tester_id ON test_feedback(tester_id);
CREATE INDEX IF NOT EXISTS idx_test_feedback_test_case_id ON test_feedback(test_case_id);
