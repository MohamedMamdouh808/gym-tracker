async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-0000-0000-000000000001'
      },
      body: JSON.stringify({
        display_name: 'Test',
        goal: 'Win',
        bio: '',
        unit_preference: 'metric',
        privacy_public: false,
        ai_persona: 'friendly'
      })
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

