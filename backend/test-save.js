require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('ANON_KEY starts with:', ANON_KEY?.slice(0, 30));
console.log('SERVICE_KEY available:', !!SERVICE_KEY);

async function run() {
  // Test 1: Admin client insert
  console.log('\n--- Test 1: Admin client insert ---');
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const payload = {
    user_id: DEFAULT_USER_ID,
    date: '2026-07-28',
    weight: 81.8,
    body_fat_percent: 27.3,
    bmi: 29.0,
    bmr: 1930,
    skeletal_muscle_mass: 56.2,
    visceral_fat_level: 11.2,
    total_body_water: 53.8,
    height: 167.9,
  };

  const { data, error } = await admin
    .from('inbody_scans')
    .insert([payload])
    .select();

  if (error) {
    console.error('❌ Admin insert FAILED:', error.message, error.code, error.details, error.hint);
  } else {
    console.log('✅ Admin insert SUCCESS! ID:', data?.[0]?.id);
  }

  // Test 2: History query
  console.log('\n--- Test 2: History query ---');
  const { data: history, error: hErr } = await admin
    .from('inbody_scans')
    .select('id, user_id, date, weight, bmi, bmr, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (hErr) {
    console.error('❌ History query FAILED:', hErr.message);
  } else {
    console.log('✅ History rows:', JSON.stringify(history, null, 2));
  }

  // Test 3: Check table columns
  console.log('\n--- Test 3: Check if segment_data column exists ---');
  const { data: cols, error: cErr } = await admin.rpc('version');
  const { data: test } = await admin
    .from('inbody_scans')
    .select('segment_data')
    .limit(1);
  if (cErr) console.error('RPC error:', cErr.message);
  console.log('segment_data field test:', JSON.stringify(test));
}

run().catch(console.error);
