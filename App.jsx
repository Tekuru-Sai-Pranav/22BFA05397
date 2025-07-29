//!
if (
  window.location.hostname !== "localhost" ||
  window.location.port !== "3000"
) {
  document.body.innerHTML = `
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>Access Denied</h2>
      <p>This app can only run on <strong>http://localhost:3000</strong></p>
      <p>You are currently on <code>${window.location.hostname}:${window.location.port}</code></p>
    </div>
  `;
  throw new Error("Blocked: Not running on http://localhost:3000");
}


import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';

// ✅ Only allow localhost:3000
if (
  window.location.hostname !== 'localhost' ||
  window.location.port !== '3000'
) {
  document.body.innerHTML =
    '<h2 style="color: red; text-align: center; margin-top: 20vh;">This app runs only on http://localhost:3000</h2>';
  throw new Error('Invalid host or port');
}

const logger = (msg) => {
  const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
  const existing = JSON.parse(sessionStorage.getItem('logs') || '[]');
  existing.push(log);
  sessionStorage.setItem('logs', JSON.stringify(existing));
};

const generateCode = () =>
  Math.random().toString(36).substring(2, 8);

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shortener />} />
        <Route path="/:code" element={<Redirect />} />
      </Routes>
    </BrowserRouter>
  );
};

const Shortener = () => {
  const [entries, setEntries] = useState([{ url: '', custom: '', time: '' }]);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('urls') || '[]'));

  const handleChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleAdd = () => {
    if (entries.length < 5) setEntries([...entries, { url: '', custom: '', time: '' }]);
  };

  const handleShorten = () => {
    const newData = [...data];
    entries.forEach(({ url, custom, time }) => {
      try {
        new URL(url);
        const code = custom || generateCode();
        if (newData.some(d => d.code === code)) throw new Error(`Code ${code} already exists`);
        const expiry = Date.now() + (parseInt(time) || 30) * 60000;
        newData.push({ url, code, expiry, clicks: 0 });
        logger(`Created: ${code} for ${url}`);
      } catch (e) {
        alert(`Error: ${e.message}`);
      }
    });
    localStorage.setItem('urls', JSON.stringify(newData));
    setData(newData);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>URL Shortener</h2>
      {entries.map((entry, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <input
            placeholder="Enter URL"
            value={entry.url}
            onChange={(e) => handleChange(i, 'url', e.target.value)}
          />
          <input
            placeholder="Custom code (opt)"
            value={entry.custom}
            onChange={(e) => handleChange(i, 'custom', e.target.value)}
          />
          <input
            placeholder="Valid for (min)"
            value={entry.time}
            onChange={(e) => handleChange(i, 'time', e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleAdd}>Add URL</button>
      <button onClick={handleShorten}>Shorten</button>

      <h3>All Short URLs</h3>
      <ul>
        {data.map((d, i) => (
          <li key={i}>
            <a href={`/${d.code}`}>{window.location.origin}/{d.code}</a><br />
            Expires: {new Date(d.expiry).toLocaleString()} | Clicks: {d.clicks}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Redirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const urls = JSON.parse(localStorage.getItem('urls') || '[]');
    const match = urls.find((u) => u.code === code);
    if (!match) {
      alert('Invalid shortcode!');
      return navigate('/');
    }
    if (Date.now() > match.expiry) {
      alert('Link expired!');
      return navigate('/');
    }
    match.clicks += 1;
    localStorage.setItem('urls', JSON.stringify(urls));
    logger(`Redirected: ${code} -> ${match.url}`);
    window.location.href = match.url;
  }, [code, navigate]);

  return <p>Redirecting...</p>;
};

export default App;
