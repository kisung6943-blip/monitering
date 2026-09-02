import http from 'http';

const urls = [
  'http://localhost:5173/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=edf6c362',
  'http://localhost:5173/node_modules/.vite/deps/react.js?v=edf6c362',
  'http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=edf6c362',
  'http://localhost:5173/src/App.tsx',
  'http://localhost:5173/src/index.css'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`URL: ${url} -> STATUS: ${res.statusCode} (Content-Type: ${res.headers['content-type']})`);
      resolve(res.statusCode);
    }).on('error', (e) => {
      console.log(`URL: ${url} -> ERROR: ${e.message}`);
      resolve(500);
    });
  });
}

async function run() {
  for (const url of urls) {
    await checkUrl(url);
  }
}

run();
