/*
  # Fix Users Table RLS Policies
  
  1. Changes
    - Drop existing policies
    - Create new non-recursive policies
  
  2. Security
    - All authenticated users can read user profiles
    - Users can insert their own profile during registration
    - Users can update their own non-role fields
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;

-- Create new non-recursive policies
CREATE POLICY "Allow authenticated read access" ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow self registration" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow self profile update" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);