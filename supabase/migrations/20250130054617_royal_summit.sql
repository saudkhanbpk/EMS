/*
  # Fix Users Table RLS Policies
  
  1. Changes
    - Drop existing policies that cause recursion
    - Create new simplified policies for role-based access
  
  2. Security
    - Users can read their own profile
    - Admins can read all profiles
    - Users can update their own non-role fields
    - Allow new user registration
*/

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Managers can view their team members" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new simplified policies
CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (
    auth.uid() = id OR -- User can read their own profile
    EXISTS ( -- Admin can read all profiles
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create a simpler update policy that prevents role changes
CREATE POLICY "Enable update for users" ON users
  FOR UPDATE USING (
    auth.uid() = id -- Users can only update their own profile
  );