-- Add source column to dailylog table for tracking message origin
-- This migration safely adds the source column if it doesn't exist

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

-- Add source column to dailylog table if it doesn't exist
DO $$ 
BEGIN
  IF NOT column_exists('dailylog', 'source') THEN
    ALTER TABLE dailylog
    ADD COLUMN source TEXT CHECK (source IN ('web', 'slack')) DEFAULT 'web';
    
    -- Add comment to document the column
    COMMENT ON COLUMN dailylog.source IS 'Source of the daily log message: web (from web interface) or slack (from Slack bot)';
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_dailylog_source ON dailylog(source);
    
    RAISE NOTICE 'Added source column to dailylog table';
  ELSE
    RAISE NOTICE 'Source column already exists in dailylog table';
  END IF;
END $$;

-- Clean up the helper function
DROP FUNCTION IF EXISTS column_exists(text, text);
