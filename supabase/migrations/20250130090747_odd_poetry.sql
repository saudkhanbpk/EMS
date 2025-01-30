/*
  # Add Task Management System

  1. New Tables
    - `task_statuses`
      - `id` (uuid, primary key)
      - `name` (text, e.g., 'To Do', 'In Progress', 'Done')
      - `order` (integer, for sorting)
      - `color` (text, for UI display)
    
    - `task_priorities`
      - `id` (uuid, primary key)
      - `name` (text, e.g., 'Low', 'Medium', 'High')
      - `order` (integer, for sorting)
      - `color` (text, for UI display)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status_id` (uuid, references task_statuses)
      - `priority_id` (uuid, references task_priorities)
      - `assignee_id` (uuid, references users)
      - `reporter_id` (uuid, references users)
      - `due_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `task_comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, references tasks)
      - `user_id` (uuid, references users)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for task management
*/

-- Create task statuses table
CREATE TABLE task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task priorities table
CREATE TABLE task_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES task_statuses(id),
  priority_id UUID NOT NULL REFERENCES task_priorities(id),
  assignee_id UUID REFERENCES users(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task comments table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to task statuses" ON task_statuses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to task priorities" ON task_priorities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    assignee_id = auth.uid() OR 
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Allow create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reporter_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Allow update assigned tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid() OR
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Allow read access to task comments" ON task_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_comments.task_id
      AND (
        assignee_id = auth.uid() OR
        reporter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Allow create task comments" ON task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks
      WHERE id = task_comments.task_id
      AND (
        assignee_id = auth.uid() OR
        reporter_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'manager')
        )
      )
    )
  );

-- Insert default statuses
INSERT INTO task_statuses (name, order_position, color) VALUES
  ('To Do', 1, '#E2E8F0'),
  ('In Progress', 2, '#93C5FD'),
  ('Review', 3, '#FCD34D'),
  ('Done', 4, '#86EFAC');

-- Insert default priorities
INSERT INTO task_priorities (name, order_position, color) VALUES
  ('Low', 1, '#94A3B8'),
  ('Medium', 2, '#FCD34D'),
  ('High', 3, '#F87171'),
  ('Urgent', 4, '#EF4444');

-- Add updated_at trigger
CREATE TRIGGER update_task_statuses_updated_at
  BEFORE UPDATE ON task_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_task_priorities_updated_at
  BEFORE UPDATE ON task_priorities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();