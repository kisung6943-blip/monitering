import http from 'http';

console.log("Fetching http://localhost:5173/src/App.tsx ...");
const req = http.get('http://localhost:5173/src/App.tsx', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('BODY RECEIVED (first 300 chars):');
    console.log(body.substring(0, 300));
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
