-- CRITICAL FIX: Create laptop_states table
-- COPY THIS ENTIRE SCRIPT AND RUN IN SUPABASE SQL EDITOR

-- Step 1: Create enum type
DO $$ BEGIN
    CREATE TYPE laptop_state AS ENUM ('On', 'Sleep', 'Off');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Drop and recreate table completely
DROP TABLE IF EXISTS laptop_states CASCADE;

-- Step 3: Create the table with all permissions
CREATE TABLE laptop_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  state laptop_state NOT NULL DEFAULT 'On',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity TIMESTAMPTZ,
  battery_level INTEGER,
  is_charging BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_laptop_states_user_id ON laptop_states(user_id);
CREATE INDEX idx_laptop_states_updated_at ON laptop_states(updated_at);
CREATE INDEX idx_laptop_states_state ON laptop_states(state);

-- Step 5: DISABLE ALL SECURITY (for testing)
ALTER TABLE laptop_states DISABLE ROW LEVEL SECURITY;

-- Step 6: Grant FULL permissions to everyone
GRANT ALL PRIVILEGES ON laptop_states TO authenticated;
GRANT ALL PRIVILEGES ON laptop_states TO anon;
GRANT ALL PRIVILEGES ON laptop_states TO postgres;
GRANT ALL PRIVILEGES ON laptop_states TO public;

-- Step 7: Grant sequence permissions (if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 8: Test the table works
INSERT INTO laptop_states (user_id, state, battery_level, is_charging)
VALUES ('test-user-12345', 'On', 85, true)
ON CONFLICT (user_id) DO UPDATE SET
  state = EXCLUDED.state,
  battery_level = EXCLUDED.battery_level,
  is_charging = EXCLUDED.is_charging,
  updated_at = now();

-- Step 9: Verify success
SELECT 'SUCCESS: laptop_states table created and tested!' as status;
SELECT COUNT(*) as total_records FROM laptop_states;
SELECT user_id, state, battery_level, created_at FROM laptop_states LIMIT 5;
