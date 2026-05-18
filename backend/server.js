require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Multer: store file in memory as Buffer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client that bypasses RLS (if SERVICE_ROLE_KEY is provided)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

if (!supabaseAdmin) {
  console.warn('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Requests may fail if RLS is enabled without policies.');
}

// Gemini Setup
const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set in environment variables.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper to get authenticated Supabase client
// For write operations, we prefer the Admin client to bypass RLS
const getAuthenticatedSupabase = (req) => {
  // If we have a service role key, use the admin client to ensure success
  if (supabaseAdmin) return supabaseAdmin;

  // Fallback to JWT-based auth if no admin key exists
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
  }
  return supabase; // Fallback to anon client
};

// Default demo user UUID (used when no auth is configured)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Helper for row-level security (RLS) simulation or future auth integration
const getUserId = (req) => {
  return req.headers['x-user-id'] || req.query.user_id || req.body.user_id || DEFAULT_USER_ID;
};

// ============ HEALTH ============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'GymTracker AI', 
    timestamp: new Date().toISOString() 
  });
});

// ============ WEIGHT LOGS ============
app.post('/api/weight', async (req, res) => {
  const { date, weight, body_fat } = req.body;
  const user_id = getUserId(req);

  if (!date || !weight) return res.status(400).json({ error: 'date and weight required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('weight_logs')
    .insert([{ user_id, date, weight: Math.round(+weight * 10) / 10, body_fat: body_fat ? Math.round(+body_fat * 10) / 10 : null }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

app.get('/api/weight', async (req, res) => {
  const user_id = getUserId(req);
  const limit = +(req.query.limit || 30);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('weight_logs')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.get('/api/weight/stats', async (req, res) => {
  const user_id = getUserId(req);

  const { data: logs, error } = await getAuthenticatedSupabase(req)
    .from('weight_logs')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const wk = logs.filter(l => l.date >= since);
  const avg = wk.length ? wk.reduce((s, l) => s + l.weight, 0) / wk.length : null;

  res.json({ 
    success: true, 
    data: { 
      latest: logs[0] || null, 
      oldest: logs[logs.length - 1] || null, 
      weekAvg: avg ? { avg_weight: avg } : null 
    } 
  });
});

app.put('/api/weight/:id', async (req, res) => {
  const { date, weight, body_fat } = req.body;
  const user_id = getUserId(req);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('weight_logs')
    .update({ date, weight: +weight, body_fat: body_fat ? +body_fat : null })
    .eq('id', req.params.id)
    .eq('user_id', user_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

app.delete('/api/weight/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { error } = await getAuthenticatedSupabase(req)
    .from('weight_logs')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Deleted' });
});

// ============ MEALS ============
app.post('/api/meals', async (req, res) => {
  const { date, meal_type, food_name, calories = 0, protein = 0, carbs = 0, fat = 0 } = req.body;
  const user_id = getUserId(req);

  if (!date || !meal_type || !food_name) return res.status(400).json({ error: 'date, meal_type, food_name required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('meals')
    .insert([{ 
      user_id, date, meal_type, food_name, 
      calories: Math.round(+calories), protein: Math.round(+protein), carbs: Math.round(+carbs), fat: Math.round(+fat) 
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

app.get('/api/meals', async (req, res) => {
  const user_id = getUserId(req);
  const limit = +(req.query.limit || 50);
  const date = req.query.date;

  let query = getAuthenticatedSupabase(req)
    .from('meals')
    .select('*')
    .eq('user_id', user_id);

  if (date) query = query.eq('date', date);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.get('/api/meals/today', async (req, res) => {
  const user_id = getUserId(req);
  const t = new Date().toISOString().split('T')[0];

  const { data: meals, error } = await getAuthenticatedSupabase(req)
    .from('meals')
    .select('*')
    .eq('user_id', user_id)
    .eq('date', t);

  if (error) return res.status(500).json({ error: error.message });

  const totals = meals.reduce((acc, m) => ({ 
    calories: acc.calories + m.calories, 
    protein: acc.protein + m.protein, 
    carbs: acc.carbs + m.carbs, 
    fat: acc.fat + m.fat 
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  res.json({ success: true, data: { meals, totals } });
});

app.put('/api/meals/:id', async (req, res) => {
  const { date, meal_type, food_name, calories, protein, carbs, fat } = req.body;
  const user_id = getUserId(req);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('meals')
    .update({ 
      date, meal_type, food_name, 
      calories: Math.round(+calories), protein: Math.round(+protein), carbs: Math.round(+carbs), fat: Math.round(+fat) 
    })
    .eq('id', req.params.id)
    .eq('user_id', user_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

app.delete('/api/meals/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { error } = await getAuthenticatedSupabase(req)
    .from('meals')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Deleted' });
});

// ============ WORKOUT PLANS ============
app.post('/api/workout-plan', async (req, res) => {
  const { day_of_week, exercise, sets = 3, reps = 10 } = req.body;
  const user_id = getUserId(req);

  if (!day_of_week || !exercise) return res.status(400).json({ error: 'day_of_week and exercise required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('workout_plans')
    .insert([{ user_id, day_of_week, exercise, sets: Math.round(+sets), reps: Math.round(+reps) }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

app.get('/api/workout-plan', async (req, res) => {
  const user_id = getUserId(req);
  const day = req.query.day_of_week;

  let query = getAuthenticatedSupabase(req)
    .from('workout_plans')
    .select('*')
    .eq('user_id', user_id);

  if (day) query = query.eq('day_of_week', day);

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.put('/api/workout-plan/:id', async (req, res) => {
  const { day_of_week, exercise, sets, reps } = req.body;
  const user_id = getUserId(req);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('workout_plans')
    .update({ day_of_week, exercise, sets: Math.round(+sets), reps: Math.round(+reps) })
    .eq('id', req.params.id)
    .eq('user_id', user_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

app.delete('/api/workout-plan/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { error } = await getAuthenticatedSupabase(req)
    .from('workout_plans')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Deleted' });
});

// ============ COMMUNITY SHARED PLANS ============
app.post('/api/community/share', async (req, res) => {
  const user_id = getUserId(req);
  const { name, difficulty, description, author } = req.body;

  if (!name || !author) return res.status(400).json({ error: 'name and author required' });

  const authSupabase = getAuthenticatedSupabase(req);

  // 1. Fetch user's current workout plan
  const { data: userPlan, error: fetchErr } = await authSupabase
    .from('workout_plans')
    .select('day_of_week, exercise, sets, reps')
    .eq('user_id', user_id);

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!userPlan || userPlan.length === 0) {
    return res.status(400).json({ error: 'Your program is empty. Add exercises before sharing.' });
  }

  // 2. Save to community_programs
  const payload = {
    user_id,
    name,
    author,
    difficulty: difficulty || 'Intermediate',
    description: description || '',
    exercises: userPlan
  };

  const { data, error } = await authSupabase
    .from('community_programs')
    .insert([payload])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

app.get('/api/community/plans', async (req, res) => {
  const { data, error } = await getAuthenticatedSupabase(req)
    .from('community_programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data || [] });
});

app.delete('/api/community/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { id } = req.params;

  const { error } = await getAuthenticatedSupabase(req)
    .from('community_programs')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Program removed from community' });
});

// ============ WORKOUT LOGS ============
app.post('/api/workout-log', async (req, res) => {
  const { date, exercise, sets = 3, reps = 10, weight = 0, completed = 1 } = req.body;
  const user_id = getUserId(req);

  if (!date || !exercise) return res.status(400).json({ error: 'date and exercise required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('workout_logs')
    .insert([{ 
      user_id, date, exercise, 
      sets: Math.round(+sets), reps: Math.round(+reps), weight: Math.round(+weight * 10) / 10, 
      completed: !!completed 
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

app.get('/api/workout-log', async (req, res) => {
  const user_id = getUserId(req);
  const limit = +(req.query.limit || 50);
  const date = req.query.date;

  let query = getAuthenticatedSupabase(req)
    .from('workout_logs')
    .select('*')
    .eq('user_id', user_id);

  if (date) query = query.eq('date', date);

  const { data, error } = await query
    .order('date', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.put('/api/workout-log/:id', async (req, res) => {
  const { date, exercise, sets, reps, weight, completed } = req.body;
  const user_id = getUserId(req);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('workout_logs')
    .update({ 
      date, exercise, 
      sets: Math.round(+sets), reps: Math.round(+reps), weight: Math.round(+weight * 10) / 10, 
      completed: !!completed 
    })
    .eq('id', req.params.id)
    .eq('user_id', user_id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

app.delete('/api/workout-log/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { error } = await getAuthenticatedSupabase(req)
    .from('workout_logs')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Deleted' });
});

// ============ WATER LOGS ============
app.post('/api/water', async (req, res) => {
  const { date, amount_ml } = req.body;
  const user_id = getUserId(req);

  if (!date || !amount_ml) return res.status(400).json({ error: 'date and amount_ml required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('water_logs')
    .insert([{ user_id, date, amount_ml: Math.round(+amount_ml) }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

app.get('/api/water', async (req, res) => {
  const user_id = getUserId(req);
  const date = req.query.date;

  let query = getAuthenticatedSupabase(req)
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user_id);

  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const total = (data || []).reduce((s, w) => s + w.amount_ml, 0);
  res.json({ success: true, total });
});

app.get('/api/water/today', async (req, res) => {
  const user_id = getUserId(req);
  const t = new Date().toISOString().split('T')[0];

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user_id)
    .eq('date', t);

  if (error) return res.status(500).json({ error: error.message });
  const total = (data || []).reduce((s, w) => s + w.amount_ml, 0);
  res.json({ success: true, total });
});

app.get('/api/workout-log/stats', async (req, res) => {
  const user_id = getUserId(req);
  const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('workout_logs')
    .select('date, completed')
    .eq('user_id', user_id)
    .gte('date', since)
    .eq('completed', true);

  if (error) return res.status(500).json({ error: error.message });

  const weekCount = new Set(data.map(wl => wl.date)).size;
  
  // Get all completed dates for recent history
  const { data: allLogs } = await getAuthenticatedSupabase(req)
    .from('workout_logs')
    .select('date')
    .eq('user_id', user_id)
    .eq('completed', true)
    .order('date', { ascending: false })
    .limit(100);

  const recentDates = [...new Set((allLogs || []).map(wl => wl.date))].slice(0, 30);

  res.json({ success: true, data: { thisWeek: weekCount, recentDates } });
});

// ============ DASHBOARD ============
app.get('/api/dashboard', async (req, res) => {
  const user_id = getUserId(req);
  const t = new Date().toISOString().split('T')[0];
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // Fetch multiple data points in parallel
  const authSupabase = getAuthenticatedSupabase(req);
  const results = await Promise.allSettled([
    authSupabase.from('weight_logs').select('date, weight').eq('user_id', user_id).order('date', { ascending: false }).limit(30),
    authSupabase.from('meals').select('*').eq('user_id', user_id).eq('date', t),
    authSupabase.from('workout_logs').select('date, exercise, completed').eq('user_id', user_id).gte('date', since7),
    authSupabase.from('meals').select('date, calories').eq('user_id', user_id).order('date', { ascending: false }).limit(200),
    authSupabase.from('water_logs').select('amount_ml').eq('user_id', user_id).eq('date', t)
  ]);

  const [weightRes, mealsRes, workoutsRes, allMealsRes, waterRes] = results.map(r => r.status === 'fulfilled' ? r.value : { data: [] });

  const weightLogs = weightRes.data || [];
  const weightHistory = [...weightLogs].reverse();
  const mealData = mealsRes.data || [];
  const caloriesToday = mealData.reduce((s, m) => s + m.calories, 0);
  const proteinToday = mealData.reduce((s, m) => s + (m.protein || 0), 0);
  const carbsToday = mealData.reduce((s, m) => s + (m.carbs || 0), 0);
  const fatToday = mealData.reduce((s, m) => s + (m.fat || 0), 0);
  
  const waterToday = (waterRes.data || []).reduce((s, w) => s + w.amount_ml, 0);

  const weekWorkouts = new Set((workoutsRes.data || []).filter(w => w.completed).map(w => w.date)).size;
  const todayWorkoutCount = new Set((workoutsRes.data || []).filter(w => w.date === t && w.completed).map(w => w.exercise)).size;

  const calMap = {};
  (allMealsRes.data || []).forEach(m => {
    calMap[m.date] = (calMap[m.date] || 0) + m.calories;
  });
  const calHistory = Object.entries(calMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, total_calories]) => ({ date, total_calories }));

  // Calculate Streak
  const { data: streakLogs } = await authSupabase.from('workout_logs').select('date').eq('user_id', user_id).eq('completed', true).order('date', { ascending: false });
  const uniqueDates = [...new Set((streakLogs || []).map(l => l.date))];
  let streak = 0;
  if (uniqueDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      streak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i]);
        const d2 = new Date(uniqueDates[i+1]);
        const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) streak++;
        else break;
      }
    }
  }

  res.json({ 
    success: true, 
    data: { 
      latestWeight: weightLogs[0] || null, 
      weightHistory, 
      caloriesToday, 
      proteinToday,
      carbsToday,
      fatToday,
      waterToday,
      todayWorkoutCount, 
      weekWorkouts, 
      calHistory,
      streak,
      mealsToday: mealData
    } 
  });
});

// ============ PERSONAL RECORDS ============
app.get('/api/prs', async (req, res) => {
  const user_id = getUserId(req);
  const { data, error } = await getAuthenticatedSupabase(req)
    .from('personal_records')
    .select('*')
    .eq('user_id', user_id)
    .order('weight', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.post('/api/prs', async (req, res) => {
  const { exercise, weight, date } = req.body;
  const user_id = getUserId(req);

  if (!exercise || !weight) return res.status(400).json({ error: 'exercise and weight required' });

  // Update if exists or insert
  const { data, error } = await getAuthenticatedSupabase(req)
    .from('personal_records')
    .upsert({ user_id, exercise, weight: +weight, date }, { onConflict: 'user_id,exercise' })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ success: true, data: data[0] });
});

// ============ AI COACH (Gemini) ============
app.post('/api/ai/coach', async (req, res) => {
  const user_id = getUserId(req);
  const { message, context } = req.body;

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_key') {
    return res.status(500).json({ error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.' });
  }

  try {
    const authSupabase = getAuthenticatedSupabase(req);
    
    // Fetch user context
    let userStats = context;
    if (!userStats) {
      const [weights, meals, workouts, prs, plan] = await Promise.all([
        authSupabase.from('weight_logs').select('*').eq('user_id', user_id).order('date', { ascending: false }).limit(10),
        authSupabase.from('meals').select('*').eq('user_id', user_id).order('date', { ascending: false }).limit(20),
        authSupabase.from('workout_logs').select('*').eq('user_id', user_id).order('date', { ascending: false }).limit(30),
        authSupabase.from('personal_records').select('*').eq('user_id', user_id).order('weight', { ascending: false }),
        authSupabase.from('workout_plans').select('*').eq('user_id', user_id)
      ]);

      userStats = { 
        weights: weights.data || [], 
        meals: meals.data || [],
        workouts: workouts.data || [],
        personal_records: prs.data || [],
        current_plan: plan.data || []
      };
    }

    // Fetch last 10 InBody scans for trend analysis
    const { data: recentScans } = await authSupabase
      .from('inbody_scans')
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .limit(10);

    const latestScan = recentScans?.[0] || null;
    const inbodyContext = recentScans?.length 
      ? `InBody Scan History (Trend Analysis):\n${JSON.stringify(recentScans, null, 2)}` 
      : 'No InBody scan history available.';

    const systemPrompt = `You are "GymTracker Pro AI Coach", an elite fitness and nutrition expert.
    
Body Composition (InBody):
${inbodyContext}

Comprehensive User History:
${JSON.stringify(userStats, null, 2)}

Instructions:
1. DATA-DRIVEN COACHING: Use the InBody metrics, workout logs, and PRs to give precise advice.
2. NUTRITION: Calculate TDEE/Macros based on Lean Body Mass if InBody data exists.
3. TRAINING: If they have a plan but their logs show they are missing days, point it out. 
4. PROGRESS: Reference PRs and weight trends (e.g., "Great job on that ${userStats.personal_records?.[0]?.exercise || 'lift'}!").
5. INBODY SPECS: Reference specific numbers like BMR: ${latestScan?.bmr || 'unknown'} kcal, Body Fat: ${latestScan?.body_fat_percent || 'unknown'}%.
6. FORMAT: Use professional markdown, bold key takeaways, and bullet points.

Respond as a supportive but firm coach who values scientific accuracy and consistency.`;

    // Use Groq as primary if available
    if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
        });

        const advice = completion.choices[0]?.message?.content;
        if (advice) {
          return res.json({ success: true, provider: 'groq', advice });
        }
      } catch (groqErr) {
        console.error('Groq Error:', groqErr.message);
      }
    }

    // Fallback to Gemini
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    let responseText = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const currentModel = genAI.getGenerativeModel({ model: modelName });
        const result = await currentModel.generateContent([systemPrompt, message]);
        responseText = result.response.text();
        if (responseText) break;
      } catch (err) {
        lastError = err;
        console.error(`Error with Gemini ${modelName}:`, err.message);
      }
    }

    if (!responseText) {
      throw new Error(lastError?.message || 'AI Service unavailable');
    }

    res.json({ success: true, provider: 'gemini', advice: responseText });
  } catch (err) {
    console.error('AI Route Error:', err);
    res.status(500).json({ error: err.message || 'AI Coaching failed' });
  }
});

// ============ REPORTS ============
app.get('/api/reports/weekly', async (req, res) => {
  const user_id = getUserId(req);
  const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const authSupabase = getAuthenticatedSupabase(req);
  const [weightRes, mealsRes, workoutsRes] = await Promise.all([
    authSupabase.from('weight_logs').select('weight, date').eq('user_id', user_id).gte('date', since).order('date', { ascending: true }),
    authSupabase.from('meals').select('calories, date').eq('user_id', user_id).gte('date', since),
    authSupabase.from('workout_logs').select('date, completed').eq('user_id', user_id).gte('date', since).eq('completed', true)
  ]);

  const wW = weightRes.data || [];
  const wM = mealsRes.data || [];
  const wWDates = [...new Set((workoutsRes.data || []).map(wl => wl.date))];

  const calByDate = {};
  wM.forEach(m => { calByDate[m.date] = (calByDate[m.date] || 0) + m.calories; });
  const cVals = Object.values(calByDate);
  const avgCal = cVals.length ? Math.round(cVals.reduce((s, c) => s + c, 0) / cVals.length) : 0;

  res.json({ 
    success: true, 
    data: { 
      weightChange: { 
        start_weight: wW[0]?.weight || null, 
        end_weight: wW[wW.length - 1]?.weight || null, 
        avg_weight: wW.length ? wW.reduce((s, w) => s + w.weight, 0) / wW.length : null 
      }, 
      workoutsCompleted: wWDates.length, 
      avgDailyCalories: avgCal, 
      period: '7 days', 
      generatedAt: new Date().toISOString() 
    } 
  });
});

// ============ INBODY SCAN (AI Vision) ============
const INBODY_EXTRACTION_PROMPT = `You are analyzing an InBody body composition scan report image.
Extract ALL numerical values you can see in the image. Return ONLY a valid JSON object with these fields (use null if a value is not found):
{
  "date": "YYYY-MM-DD or null",
  "weight": number or null,
  "body_fat_percent": number or null,
  "body_fat_mass": number or null,
  "skeletal_muscle_mass": number or null,
  "lean_body_mass": number or null,
  "total_body_water": number or null,
  "protein": number or null,
  "minerals": number or null,
  "bmi": number or null,
  "bmr": number or null,
  "visceral_fat_level": number or null,
  "metabolic_age": number or null,
  "right_arm_muscle": number or null,
  "left_arm_muscle": number or null,
  "trunk_muscle": number or null,
  "right_leg_muscle": number or null,
  "left_leg_muscle": number or null,
  "right_arm_fat": number or null,
  "left_arm_fat": number or null,
  "trunk_fat": number or null,
  "right_leg_fat": number or null,
  "left_leg_fat": number or null,
  "height": number or null,
  "age": number or null,
  "gender": "male" or "female" or null
}
Return ONLY the JSON, no markdown, no explanation.`;

app.post('/api/inbody/scan', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const user_id = getUserId(req);
  const imageBase64 = req.file.buffer.toString('base64');
  const mimeType = req.file.mimetype || 'image/jpeg';

  let extracted = null;

  // --- PRIMARY: Groq Vision ---
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: INBODY_EXTRACTION_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      });
      const rawText = groqRes.choices[0]?.message?.content || '';
      extracted = JSON.parse(rawText);
      console.log('✅ InBody extracted via Groq Vision');
    } catch (groqErr) {
      console.error('Groq Vision failed, falling back to Gemini:', groqErr.message);
    }
  }

  // --- FALLBACK: Gemini Vision ---
  if (!extracted && process.env.GEMINI_API_KEY) {
    try {
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await geminiModel.generateContent([
        INBODY_EXTRACTION_PROMPT,
        { inlineData: { mimeType, data: imageBase64 } }
      ]);
      let rawText = result.response.text().trim();
      // Strip markdown code fences if present
      rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      extracted = JSON.parse(rawText);
      console.log('✅ InBody extracted via Gemini Vision');
    } catch (gemErr) {
      console.error('Gemini Vision also failed:', gemErr.message);
      return res.status(500).json({ error: 'AI vision extraction failed. Please try a clearer image.' });
    }
  }

  if (!extracted) {
    return res.status(500).json({ error: 'No AI provider available for vision extraction.' });
  }

  // Save to inbody_scans table (full record)
  const scanDate = extracted.date || new Date().toISOString().split('T')[0];
  const authSupabase = getAuthenticatedSupabase(req);

  const { data: scanData, error: scanError } = await authSupabase
    .from('inbody_scans')
    .insert([{
      user_id,
      date: scanDate,
      weight: extracted.weight,
      body_fat_percent: extracted.body_fat_percent,
      body_fat_mass: extracted.body_fat_mass,
      skeletal_muscle_mass: extracted.skeletal_muscle_mass,
      lean_body_mass: extracted.lean_body_mass,
      total_body_water: extracted.total_body_water,
      protein: extracted.protein,
      minerals: extracted.minerals,
      bmi: extracted.bmi,
      bmr: extracted.bmr,
      visceral_fat_level: extracted.visceral_fat_level,
      metabolic_age: extracted.metabolic_age,
      height: extracted.height,
      age: extracted.age,
      gender: extracted.gender,
      segment_data: {
        right_arm_muscle: extracted.right_arm_muscle,
        left_arm_muscle: extracted.left_arm_muscle,
        trunk_muscle: extracted.trunk_muscle,
        right_leg_muscle: extracted.right_leg_muscle,
        left_leg_muscle: extracted.left_leg_muscle,
        right_arm_fat: extracted.right_arm_fat,
        left_arm_fat: extracted.left_arm_fat,
        trunk_fat: extracted.trunk_fat,
        right_leg_fat: extracted.right_leg_fat,
        left_leg_fat: extracted.left_leg_fat,
      }
    }])
    .select();

  if (scanError) {
    console.warn('inbody_scans insert failed (table may not exist yet):', scanError.message);
  }

  // Also auto-log to weight_logs if weight is present
  let weightLogData = null;
  if (extracted.weight) {
    const { data: wData } = await authSupabase
      .from('weight_logs')
      .insert([{
        user_id,
        date: scanDate,
        weight: Math.round(extracted.weight * 10) / 10,
        body_fat: extracted.body_fat_percent ? Math.round(extracted.body_fat_percent * 10) / 10 : null
      }])
      .select();
    weightLogData = wData?.[0] || null;
  }

  res.json({
    success: true,
    extracted,
    scanId: scanData?.[0]?.id || null,
    weightLogged: !!weightLogData,
    message: `Extracted ${Object.values(extracted).filter(v => v !== null).length} metrics from your InBody scan`
  });
});

// GET: InBody scan history
app.get('/api/inbody/history', async (req, res) => {
  const user_id = getUserId(req);
  const limit = +(req.query.limit || 20);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('inbody_scans')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data || [] });
});

// GET: Latest InBody scan (for pre-filling other pages)
app.get('/api/inbody/latest', async (req, res) => {
  const user_id = getUserId(req);

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('inbody_scans')
    .select('*')
    .eq('user_id', user_id)
    .not('weight', 'is', null) // Ignore empty scans
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data || null });
});

// DELETE: Remove an InBody scan and its linked weight log
app.delete('/api/inbody/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { id } = req.params;
  const authSupabase = getAuthenticatedSupabase(req);

  // Get the scan first to find the date for weight_log cleanup
  const { data: scan } = await authSupabase
    .from('inbody_scans')
    .select('date')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();

  const { error } = await authSupabase
    .from('inbody_scans')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: error.message });

  // If we found the scan, try to delete the matching weight log too
  if (scan) {
    await authSupabase
      .from('weight_logs')
      .delete()
      .eq('user_id', user_id)
      .eq('date', scan.date);
  }

  res.json({ success: true });
});

// PATCH: Edit an InBody scan (Full metric support + Global Sync)
app.patch('/api/inbody/:id', async (req, res) => {
  const user_id = getUserId(req);
  const { id } = req.params;
  const updates = req.body;
  const authSupabase = getAuthenticatedSupabase(req);

  // Get original scan to handle date/weight changes in weight_logs
  const { data: oldScan } = await authSupabase
    .from('inbody_scans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();

  const { data, error } = await authSupabase
    .from('inbody_scans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Sync with weight_logs
  if (oldScan && (updates.weight || updates.date || updates.body_fat_percent)) {
    const newWeight = updates.weight || data.weight;
    const newDate = updates.date || data.date;
    const newFat = updates.body_fat_percent || data.body_fat_percent;

    // Update existing log on the OLD date
    await authSupabase
      .from('weight_logs')
      .update({ 
        weight: newWeight, 
        date: newDate,
        body_fat: newFat 
      })
      .eq('user_id', user_id)
      .eq('date', oldScan.date);
  }

  res.json({ success: true, data });
});

// ============ PROFILES ============
app.get('/api/profile', async (req, res) => {
  const user_id = getUserId(req);
  
  const { data, error } = await getAuthenticatedSupabase(req)
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data || null });
});

app.put('/api/profile', async (req, res) => {
  const user_id = getUserId(req);
  const { display_name, goal, bio, unit_preference, privacy_public, ai_persona } = req.body;

  const updates = {
    id: user_id,
    display_name,
    goal,
    bio,
    unit_preference: unit_preference || 'metric',
    privacy_public: !!privacy_public,
    ai_persona: ai_persona || 'friendly',
  };

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('profiles')
    .upsert(updates, { onConflict: 'id' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.get('/api/profile/stats', async (req, res) => {
  const user_id = getUserId(req);
  const authSupabase = getAuthenticatedSupabase(req);

  try {
    // Total Workouts (completed)
    const { count: totalWorkouts, error: totalError } = await authSupabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('completed', true);

    if (totalError) throw totalError;

    // Total Weight Lifted
    const { data: weightLogs, error: weightError } = await authSupabase
      .from('workout_logs')
      .select('weight, sets, reps')
      .eq('user_id', user_id)
      .eq('completed', true);

    if (weightError) throw weightError;

    let totalVolume = 0;
    weightLogs.forEach(log => {
      totalVolume += (log.weight || 0) * (log.sets || 0) * (log.reps || 0);
    });

    // Current Streak
    const { data: streakLogs, error: streakError } = await authSupabase
      .from('workout_logs')
      .select('date')
      .eq('user_id', user_id)
      .eq('completed', true)
      .order('date', { ascending: false });

    if (streakError) throw streakError;

    const uniqueDates = [...new Set((streakLogs || []).map(l => l.date))];
    let streak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const d1 = new Date(uniqueDates[i]);
          const d2 = new Date(uniqueDates[i+1]);
          const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
          if (Math.round(diff) === 1) streak++;
          else break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalWorkouts: totalWorkouts || 0,
        totalVolume,
        currentStreak: streak
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`\n🚀 GymTracker AI Backend → http://localhost:${PORT}`);
  console.log(`📊 Health → http://localhost:${PORT}/api/health\n`);
});
