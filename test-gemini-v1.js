const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AQAb8RN_INVALID_KEY`;

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: "hello" }] }] })
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(console.log)
.catch(console.error);
