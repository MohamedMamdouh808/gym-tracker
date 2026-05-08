require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper to get authenticated Supabase client based on incoming JWT
const getAuthenticatedSupabase = (req) => {
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
    .insert([{ user_id, date, weight: +weight, body_fat: body_fat ? +body_fat : null }])
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

// ============ MEALS ============
app.post('/api/meals', async (req, res) => {
  const { date, meal_type, food_name, calories = 0, protein = 0, carbs = 0, fat = 0 } = req.body;
  const user_id = getUserId(req);

  if (!date || !meal_type || !food_name) return res.status(400).json({ error: 'date, meal_type, food_name required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('meals')
    .insert([{ 
      user_id, date, meal_type, food_name, 
      calories: +calories, protein: +protein, carbs: +carbs, fat: +fat 
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

// ============ WORKOUT PLANS ============
app.post('/api/workout-plan', async (req, res) => {
  const { day_of_week, exercise, sets = 3, reps = 10 } = req.body;
  const user_id = getUserId(req);

  if (!day_of_week || !exercise) return res.status(400).json({ error: 'day_of_week and exercise required' });

  const { data, error } = await getAuthenticatedSupabase(req)
    .from('workout_plans')
    .insert([{ user_id, day_of_week, exercise, sets: +sets, reps: +reps }])
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

app.delete('/api/workout-plan/:id', async (req, res) => {
  const { error } = await getAuthenticatedSupabase(req)
    .from('workout_plans')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Deleted' });
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
      sets: +sets, reps: +reps, weight: +weight, 
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
  const [weightRes, mealsRes, workoutsRes, allMealsRes] = await Promise.all([
    authSupabase.from('weight_logs').select('date, weight').eq('user_id', user_id).order('date', { ascending: false }).limit(30),
    authSupabase.from('meals').select('calories').eq('user_id', user_id).eq('date', t),
    authSupabase.from('workout_logs').select('date, exercise, completed').eq('user_id', user_id).gte('date', since7),
    authSupabase.from('meals').select('date, calories').eq('user_id', user_id).order('date', { ascending: false }).limit(200)
  ]);

  const weightLogs = weightRes.data || [];
  const weightHistory = [...weightLogs].reverse();
  const caloriesToday = (mealsRes.data || []).reduce((s, m) => s + m.calories, 0);
  
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

  res.json({ 
    success: true, 
    data: { 
      latestWeight: weightLogs[0] || null, 
      weightHistory, 
      caloriesToday, 
      todayWorkoutCount, 
      weekWorkouts, 
      calHistory 
    } 
  });
});

// ============ AI COACH (Gemini) ============
app.post('/api/ai/coach', async (req, res) => {
  const user_id = getUserId(req);
  const { message, context } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    // Fetch user context if not provided
    let userStats = context;
    if (!userStats) {
      const authSupabase = getAuthenticatedSupabase(req);
      const { data: weights } = await authSupabase.from('weight_logs').select('*').eq('user_id', user_id).order('date', { ascending: false }).limit(5);
      const { data: meals } = await authSupabase.from('meals').select('*').eq('user_id', user_id).order('date', { ascending: false }).limit(10);
      userStats = { weights, meals };
    }

    const prompt = `You are a professional fitness and nutrition coach.
    Context: ${JSON.stringify(userStats)}
    User Question: "${message}"
    
    Instruction: Answer the user's question directly and concisely using the provided context if relevant. 
    Do not include a full status snapshot, summary, or general advice unless specifically asked. 
    Focus only on what the user is asking right now.
    Format your response in concise markdown.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ success: true, advice: responseText });
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({ error: err.message || err.toString() || 'AI Coaching failed' });
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

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`\n🚀 GymTracker AI Backend → http://localhost:${PORT}`);
  console.log(`📊 Health → http://localhost:${PORT}/api/health\n`);
});
