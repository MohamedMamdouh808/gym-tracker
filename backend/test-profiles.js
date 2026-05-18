const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://wfdsieucjqfyhcpmqiqa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZHNpZXVjanFmeWhjcG1xaXFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI0ODI3NSwiZXhwIjoyMDkzODI0Mjc1fQ.RNeUoJ4fVSA-X6AXyVHyeDfFGOJbw0H0uwmctPo1jfg'
);

async function test() {
  const updates = {
    id: '00000000-0000-0000-0000-000000000001',
    display_name: 'Test',
    goal: 'Win',
    bio: '',
    unit_preference: 'metric',
    privacy_public: false,
    ai_persona: 'friendly',
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(updates, { onConflict: 'id' })
    .select()
    .single();

  console.log('Data:', data);
  console.log('Error:', error);
}

test();
