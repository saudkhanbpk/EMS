/*
  # ETAMS Database Schema

  1. New Tables
    - users
      - Extended user profile information
      - Role-based access control
    - attendance_logs
      - GPS-based check-in/out records
      - Work mode tracking
    - breaks
      - Break time tracking
    - leave_requests
      - Leave management system
    - locations
      - Office locations with geofencing
    
  2. Security
    - RLS policies for all tables
    - Role-based access control
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE work_mode AS ENUM ('on_site', 'remote');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department TEXT,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Office locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100, -- Geofencing radius in meters
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance logs table
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  location_id UUID REFERENCES locations(id),
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  work_mode work_mode NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Break logs table
CREATE TABLE breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance_logs(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leave balance table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  leave_type leave_type NOT NULL,
  balance DECIMAL(5, 2) NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, leave_type, year)
);

-- Leave requests table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status leave_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Managers can view their team members"
  ON users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    ) OR 
    auth.uid() = manager_id
  );

-- Attendance policies
CREATE POLICY "Users can view their own attendance"
  ON attendance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance"
  ON attendance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance"
  ON attendance_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Break policies
CREATE POLICY "Users can manage their own breaks"
  ON breaks FOR ALL
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM attendance_logs 
      WHERE id = attendance_id
    )
  );

-- Leave policies
CREATE POLICY "Users can view their own leave requests"
  ON leave_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371000; -- Earth radius in meters
  φ1 DECIMAL := lat1 * PI() / 180;
  φ2 DECIMAL := lat2 * PI() / 180;
  Δφ DECIMAL := (lat2 - lat1) * PI() / 180;
  Δλ DECIMAL := (lon2 - lon1) * PI() / 180;
  a DECIMAL;
  c DECIMAL;
  d DECIMAL;
BEGIN
  a := sin(Δφ/2) * sin(Δφ/2) +
       cos(φ1) * cos(φ2) *
       sin(Δλ/2) * sin(Δλ/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  d := R * c;
  RETURN d;
END;
$$ LANGUAGE plpgsql;