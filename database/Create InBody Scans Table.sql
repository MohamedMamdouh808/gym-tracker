-- Run this in your Supabase SQL Editor to create the inbody_scans table
-- Dashboard → SQL Editor → New Query → Paste this → Run

CREATE TABLE IF NOT EXISTS inbody_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  
  -- Body Composition
  weight NUMERIC(5,2),
  lean_body_mass NUMERIC(5,2),
  body_fat_mass NUMERIC(5,2),
  body_fat_percent NUMERIC(5,2),
  skeletal_muscle_mass NUMERIC(5,2),
  total_body_water NUMERIC(5,2),
  protein NUMERIC(5,2),
  minerals NUMERIC(5,2),
  
  -- Body Indexes
  bmi NUMERIC(5,2),
  visceral_fat_level INTEGER,
  metabolic_age INTEGER,
  bmr INTEGER,
  
  -- Personal Info
  height NUMERIC(5,1),
  age INTEGER,
  gender TEXT,
  
  -- Segment Analysis (stored as JSONB)
  segment_data JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_inbody_scans_user_date 
  ON inbody_scans(user_id, date DESC);

-- Optional: Enable RLS (same pattern as other tables)
-- ALTER TABLE inbody_scans ENABLE ROW LEVEL SECURITY;
