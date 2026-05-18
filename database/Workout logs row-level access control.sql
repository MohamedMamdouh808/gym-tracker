-- SELECT: user can see their rows
CREATE POLICY "workout_logs_select_own"
ON public.workout_logs
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- INSERT: user can insert rows for themselves
CREATE POLICY "workout_logs_insert_own"
ON public.workout_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));