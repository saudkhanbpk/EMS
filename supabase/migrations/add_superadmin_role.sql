/*
  # Add SuperAdmin Role to User Role Enum
  
  1. Changes
    - Add 'superadmin' to the user_role enum type
    - This allows users to have the superadmin role in the database
  
  2. Security
    - Maintains existing RLS policies
    - SuperAdmin role will have elevated permissions
*/

-- Add 'superadmin' to the user_role enum
ALTER TYPE user_role ADD VALUE 'superadmin';

-- Add comment to document the new role
COMMENT ON TYPE user_role IS 'User roles: employee (default), manager, admin, superadmin';

-- Update existing users with @superadmin.co emails to have superadmin role
UPDATE users
SET role = 'superadmin', updated_at = now()
WHERE email LIKE '%@superadmin.co' AND role != 'superadmin';

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % users to superadmin role', updated_count;
END $$;
