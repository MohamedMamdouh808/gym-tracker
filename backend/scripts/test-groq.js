require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "hi" }],
      model: "llama-3.3-70b-versatile",
    });
    console.log("SUCCESS: " + completion.choices[0].message.content);
  } catch (err) {
    console.log("FAILURE: " + err.message);
  }
}
test();
