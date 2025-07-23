/*
  # Add Complaint Comments and Reactions Tables
  
  1. New Tables
    - complaint_comments
      - Stores comments on software complaints
    - complaint_reactions
      - Stores reactions (like, dislike, heart, laugh, sad) on software complaints
  
  2. Security
    - RLS policies for both tables
    - Users can read all comments/reactions
    - Users can only create/update/delete their own comments/reactions
*/

-- Create complaint_comments table
CREATE TABLE IF NOT EXISTS complaint_comments (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES software_complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create complaint_reactions table
CREATE TABLE IF NOT EXISTS complaint_reactions (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES software_complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'heart', 'laugh', 'sad')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(complaint_id, user_id, reaction_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_user_id ON complaint_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_reactions_complaint_id ON complaint_reactions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_reactions_user_id ON complaint_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaint_comments
CREATE POLICY "Anyone can read complaint comments"
  ON complaint_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON complaint_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON complaint_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON complaint_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for complaint_reactions
CREATE POLICY "Anyone can read complaint reactions"
  ON complaint_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own reactions"
  ON complaint_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON complaint_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON complaint_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
