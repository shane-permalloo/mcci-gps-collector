/*
  # Add unique constraint to imported_locations table

  1. Changes
    - Add unique constraint on title column to prevent duplicate titles
    - Ensure data integrity for imported location titles

  Note: The id column is already present as a SERIAL PRIMARY KEY
*/

-- Add unique constraint on title if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'imported_locations_title_key'
    AND table_name = 'imported_locations'
  ) THEN
    ALTER TABLE imported_locations 
    ADD CONSTRAINT imported_locations_title_key UNIQUE (title);
  END IF;
END $$;