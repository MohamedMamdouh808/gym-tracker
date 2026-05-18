-- 1. Enable RLS on the table (if not already enabled)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow users to INSERT their own meals
CREATE POLICY "Users can insert their own meals" 
ON meals FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Create policy to allow users to SELECT their own meals
CREATE POLICY "Users can view their own meals" 
ON meals FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Create policy to allow users to UPDATE their own meals
CREATE POLICY "Users can update their own meals" 
ON meals FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Create policy to allow users to DELETE their own meals
CREATE POLICY "Users can delete their own meals" 
ON meals FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
