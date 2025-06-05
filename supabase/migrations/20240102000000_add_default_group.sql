-- Insert the default group
INSERT INTO public.groups (id, name, color, description, user_id)
VALUES 
  ('default', 'Default', '25252500', 'Default group for all locations', NULL)
ON CONFLICT (id) DO NOTHING;

-- Create a special policy to allow all users to see the default group
CREATE POLICY "Everyone can view the default group" 
  ON public.groups FOR SELECT 
  USING (id = 'default');