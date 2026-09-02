import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';

try {
  console.log('Rendering App to string...');
  const html = renderToString(React.createElement(App));
  console.log('App rendered successfully! HTML length:', html.length);
} catch (err) {
  console.error('App render error:', err);
}
