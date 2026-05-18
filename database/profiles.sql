CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    goal TEXT,
    bio TEXT,
    unit_preference TEXT DEFAULT 'metric',
    privacy_public BOOLEAN DEFAULT false,
    ai_persona TEXT DEFAULT 'friendly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
    ON public.profiles FOR UPDATE
    USING ( auth.uid() = id );

CREATE POLICY "Users can select their own profile."
    ON public.profiles FOR SELECT
    USING ( auth.uid() = id );

CREATE POLICY "Public profiles are viewable by everyone."
    ON public.profiles FOR SELECT
    USING ( privacy_public = true );
