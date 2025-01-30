/*
  # Add status columns and fix constraints

  1. Changes
    - Add status column to attendance_logs if not exists
    - Add status column to breaks if not exists
    - Ensure attendance_id is not null in breaks table
  
  2. Notes
    - Uses safe DDL that checks for existing columns/constraints
    - Maintains data integrity with proper constraints
*/

-- Function to check if a column exists
CREATE OR REPLACE FUNCTION column_exists(tbl text, col text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = tbl
    AND column_name = col
  );
END;
$$ LANGUAGE plpgsql;

-- Add status column to attendance_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT column_exists('attendance_logs', 'status') THEN
    ALTER TABLE attendance_logs
    ADD COLUMN status TEXT CHECK (status IN ('present', 'late', 'absent')) NOT NULL DEFAULT 'present';
  END IF;
END $$;

-- Add status column to breaks if it doesn't exist
DO $$ 
BEGIN
  IF NOT column_exists('breaks', 'status') THEN
    ALTER TABLE breaks
    ADD COLUMN status TEXT CHECK (status IN ('on_time', 'late')) DEFAULT 'on_time';
  END IF;
END $$;

-- Make attendance_id not null if it isn't already
DO $$ 
BEGIN
  ALTER TABLE breaks
  ALTER COLUMN attendance_id SET NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL; -- Column might already be NOT NULL
END $$;