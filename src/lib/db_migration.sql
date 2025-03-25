-- Time Tracking Tables

-- Table for time tracking sessions
CREATE TABLE IF NOT EXISTS time_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for screenshots
CREATE TABLE IF NOT EXISTS screenshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_id UUID REFERENCES time_sessions(id) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_start_time ON time_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_time_sessions_is_active ON time_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_screenshots_session_id ON screenshots(session_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);

-- Row Level Security Policies

-- Time Sessions RLS
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view and edit their own sessions
CREATE POLICY time_sessions_user_policy ON time_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
  
-- Admins can view all sessions
CREATE POLICY time_sessions_admin_policy ON time_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Screenshots RLS
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

-- Users can view their own screenshots
CREATE POLICY screenshots_user_policy ON screenshots
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
  
-- Users can insert their own screenshots
CREATE POLICY screenshots_insert_policy ON screenshots
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
  
-- Admins can view all screenshots
CREATE POLICY screenshots_admin_policy ON screenshots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

-- Storage Bucket for Screenshots
-- Note: This needs to be executed in the Supabase dashboard or via the API

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_time_sessions_updated_at
BEFORE UPDATE ON time_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 