-- Create laptop_states table for Database-Based Laptop Tracking
-- Run this in your Supabase SQL Editor

-- Create enum type for laptop states (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE laptop_state AS ENUM ('On', 'Sleep', 'Off');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create laptop_states table
CREATE TABLE IF NOT EXISTS laptop_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state laptop_state NOT NULL DEFAULT 'On',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  is_charging BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure one record per user (upsert pattern)
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_laptop_states_user_id ON laptop_states(user_id);
CREATE INDEX IF NOT EXISTS idx_laptop_states_updated_at ON laptop_states(updated_at);
CREATE INDEX IF NOT EXISTS idx_laptop_states_state ON laptop_states(state);

-- Enable Row Level Security
ALTER TABLE laptop_states ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own laptop state"
  ON laptop_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own laptop state"
  ON laptop_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own laptop state"
  ON laptop_states FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all laptop states
CREATE POLICY "Admins can view all laptop states"
  ON laptop_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow managers to view their team's laptop states
CREATE POLICY "Managers can view team laptop states"
  ON laptop_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.organization_id = u2.organization_id
      WHERE u1.id = auth.uid() 
      AND u1.role IN ('admin', 'manager')
      AND u2.id = laptop_states.user_id
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_laptop_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_laptop_states_updated_at ON laptop_states;
CREATE TRIGGER trigger_laptop_states_updated_at
  BEFORE UPDATE ON laptop_states
  FOR EACH ROW
  EXECUTE FUNCTION update_laptop_states_updated_at();

-- Create a function to get current laptop states for all users in an organization
CREATE OR REPLACE FUNCTION get_organization_laptop_states(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  state laptop_state,
  timestamp TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  battery_level INTEGER,
  is_charging BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.user_id,
    u.full_name,
    u.email,
    ls.state,
    ls.timestamp,
    ls.last_activity,
    ls.battery_level,
    ls.is_charging
  FROM laptop_states ls
  JOIN users u ON ls.user_id = u.id
  WHERE u.organization_id = org_id
  ORDER BY u.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_laptop_states(UUID) TO authenticated;

-- Insert some sample data for testing (optional)
-- This will create laptop states for existing users with different states for demonstration
INSERT INTO laptop_states (user_id, state, timestamp, last_activity, battery_level, is_charging)
SELECT
  id,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY id) % 3 = 1 THEN 'On'::laptop_state
    WHEN ROW_NUMBER() OVER (ORDER BY id) % 3 = 2 THEN 'Sleep'::laptop_state
    ELSE 'Off'::laptop_state
  END,
  now() - (RANDOM() * INTERVAL '2 hours'),
  now() - (RANDOM() * INTERVAL '30 minutes'),
  (RANDOM() * 100)::INTEGER,
  RANDOM() > 0.5
FROM users
WHERE EXISTS (SELECT 1 FROM users LIMIT 1) -- Only if users table has data
ON CONFLICT (user_id) DO NOTHING; -- Don't overwrite existing data

-- Verify the table was created successfully
SELECT 'laptop_states table created successfully!' as status;
SELECT COUNT(*) as total_records FROM laptop_states;
