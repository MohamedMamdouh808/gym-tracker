-- 1. Create Water Logs Table
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    amount_ml INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Personal Records Table
CREATE TABLE IF NOT EXISTS public.personal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    exercise TEXT NOT NULL,
    weight FLOAT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, exercise) -- Important for the 'set' functionality
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- 4. Create Basic Policies (Adjust if you have specific auth requirements)
-- Note: These policies assume you are using the default Supabase Auth
CREATE POLICY "Users can manage their own water logs" 
ON public.water_logs FOR ALL 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Users can manage their own PRs" 
ON public.personal_records FOR ALL 
USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001');
