-- Create the community_programs table
CREATE TABLE IF NOT EXISTS public.community_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Intermediate',
    description TEXT,
    exercises JSONB NOT NULL DEFAULT '[]',
    rating NUMERIC(2, 1) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.community_programs ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read community programs
CREATE POLICY "Enable read access for all users" ON public.community_programs
    FOR SELECT USING (true);

-- Allow authenticated users to insert their own community programs
CREATE POLICY "Enable insert access for authenticated users" ON public.community_programs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own community programs
CREATE POLICY "Enable update for users based on user_id" ON public.community_programs
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own community programs
CREATE POLICY "Enable delete for users based on user_id" ON public.community_programs
    FOR DELETE USING (auth.uid() = user_id);

-- Force Supabase schema cache reload (important for the PostgREST API)
NOTIFY pgrst, 'reload schema';
