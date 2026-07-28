-- Saved Foods Table
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein DECIMAL(5,1) NOT NULL DEFAULT 0,
  carbs DECIMAL(5,1) NOT NULL DEFAULT 0,
  fat DECIMAL(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "users can insert their own saved foods"
  ON saved_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can select their own saved foods"
  ON saved_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can update their own saved foods"
  ON saved_foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users can delete their own saved foods"
  ON saved_foods FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on update
CREATE TRIGGER saved_foods_updated_at BEFORE UPDATE ON saved_foods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX saved_foods_user_id_idx ON saved_foods (user_id);
CREATE INDEX saved_foods_created_at_idx ON saved_foods (created_at DESC);