/*
  # Update imported_locations table schema and policies

  1. Schema Changes
    - Drop existing imported_locations table
    - Create new imported_locations table with correct schema
      - id (numeric, primary key)
      - title (text, unique)
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS imported_locations;

-- Create imported_locations table with correct schema
CREATE TABLE imported_locations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

-- Add unique constraint on title
ALTER TABLE imported_locations 
ADD CONSTRAINT imported_locations_title_key UNIQUE (title);

-- Enable RLS
ALTER TABLE imported_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all users to read imported_locations"
ON imported_locations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all users to insert into imported_locations"
ON imported_locations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create case-insensitive index for title lookups
CREATE UNIQUE INDEX imported_locations_title_lower_idx 
ON imported_locations (LOWER(title));