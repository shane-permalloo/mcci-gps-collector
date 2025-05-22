/*
  # Add ID column to imported_locations table

  1. Changes
    - Add numeric ID column as primary key to imported_locations table
    - Add unique constraint on title column
*/

-- Add ID column to imported_locations table
ALTER TABLE imported_locations 
ADD COLUMN id SERIAL PRIMARY KEY;

-- Add unique constraint on title
ALTER TABLE imported_locations 
ADD CONSTRAINT imported_locations_title_key UNIQUE (title);