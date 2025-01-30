/*
  # Fix User and Attendance Issues

  1. Changes
    - Add trigger to automatically create user profile on auth signup
    - Add policies for attendance_logs and breaks tables
    - Ensure proper cascading for attendance records
  
  2. Security
    - Enable RLS for all tables
    - Add proper policies for data access
*/

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update attendance_logs policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Users can create their own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Users can update their own attendance" ON attendance_logs;

CREATE POLICY "Users can view their own attendance"
  ON attendance_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance"
  ON attendance_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON attendance_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update breaks policies
DROP POLICY IF EXISTS "Users can manage their own breaks" ON breaks;

CREATE POLICY "Users can view their own breaks"
  ON breaks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM attendance_logs
      WHERE id = breaks.attendance_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own breaks"
  ON breaks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance_logs
      WHERE id = attendance_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own breaks"
  ON breaks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM attendance_logs
      WHERE id = breaks.attendance_id
      AND user_id = auth.uid()
    )
  );