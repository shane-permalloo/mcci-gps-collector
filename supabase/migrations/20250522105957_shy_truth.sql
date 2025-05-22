/*
  # Update RLS policies to allow reading all records

  1. Changes
    - Update RLS policies to allow authenticated users to read all records
    - Maintain write restrictions to user's own records
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;
DROP POLICY IF EXISTS "Users can manage their own locations" ON locations;

-- Create new policies for groups
CREATE POLICY "Users can read all groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new policies for locations
CREATE POLICY "Users can read all locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
  ON locations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);