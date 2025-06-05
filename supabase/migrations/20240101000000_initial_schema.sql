-- Create tables
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  group_id UUID REFERENCES public.groups(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  directus_id TEXT
);

CREATE TABLE IF NOT EXISTS public.imported_locations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  directus_id TEXT
);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
CREATE POLICY "Users can view their own groups" 
  ON public.groups FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups" 
  ON public.groups FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups" 
  ON public.groups FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups" 
  ON public.groups FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for locations
CREATE POLICY "Users can view their own locations" 
  ON public.locations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own locations" 
  ON public.locations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations" 
  ON public.locations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations" 
  ON public.locations FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for imported_locations
CREATE POLICY "Users can view imported locations" 
  ON public.imported_locations FOR SELECT 
  TO authenticated;

CREATE POLICY "Users can create imported locations" 
  ON public.imported_locations FOR INSERT 
  TO authenticated;

CREATE POLICY "Users can update imported locations" 
  ON public.imported_locations FOR UPDATE 
  TO authenticated;

CREATE POLICY "Users can delete imported locations" 
  ON public.imported_locations FOR DELETE 
  TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS locations_user_id_idx ON public.locations (user_id);
CREATE INDEX IF NOT EXISTS locations_group_id_idx ON public.locations (group_id);
CREATE INDEX IF NOT EXISTS groups_user_id_idx ON public.groups (user_id);