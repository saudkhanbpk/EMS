/*
  # Add insert policy for users table

  1. Security Changes
    - Add policy to allow users to insert their own profile during signup
    - This policy ensures users can only insert a row with their own auth.uid()
*/

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);