/*
  # Add FCM Tokens Table
  
  1. New Table
    - fcm_tokens
      - Stores multiple FCM tokens per user
      - Each token is associated with a device
  
  2. Security
    - RLS policies for the table
*/

-- Create FCM tokens table
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own FCM tokens"
  ON fcm_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own FCM tokens"
  ON fcm_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens"
  ON fcm_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens"
  ON fcm_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update last_used_at timestamp
CREATE OR REPLACE FUNCTION update_fcm_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_used_at
CREATE TRIGGER update_fcm_token_last_used_trigger
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_fcm_token_last_used();

-- Migrate existing tokens from users table
INSERT INTO fcm_tokens (user_id, token)
SELECT id, fcm_token
FROM users
WHERE fcm_token IS NOT NULL AND fcm_token != ''
ON CONFLICT DO NOTHING;
