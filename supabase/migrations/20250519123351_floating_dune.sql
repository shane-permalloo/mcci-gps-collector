/*
  # Initial schema setup for GPS Collector

  1. Tables
    - locations
      - id (uuid, primary key)
      - title (text)
      - latitude (double precision)
      - longitude (double precision)
      - description (text)
      - tags (text[])
      - group_id (uuid, foreign key)
      - created_at (timestamptz)
      - user_id (uuid, foreign key to auth.users)
    
    - groups
      - id (uuid, primary key)
      - name (text)
      - color (text)
      - created_at (timestamptz)
      - user_id (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
CREATE POLICY "Users can manage their own groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for locations
CREATE POLICY "Users can manage their own locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);