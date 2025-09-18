const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

// Config
const PORT = process.env.PORT || 8000;
const DB_PATH = process.env.DB_PATH || './books.sqlite';

// DB + schema
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS books(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  year INTEGER,
  rating REAL CHECK(rating >= 0 AND rating <= 5)
)`);

// Seed if empty
const count = db.prepare('SELECT COUNT(*) AS c FROM books').get().c;
if (count === 0) {
  const seed = [
    ['Deep Learning', 'Ian Goodfellow', 2016, 4.7],
    ['Hands-On Machine Learning', 'Aurélien Géron', 2023, 4.8],
    ['AI: A Modern Approach', 'Russell & Norvig', 2020, 4.7],
    ['Reinforcement Learning', 'Sutton & Barto', 2018, 4.7],
    ['Deep Learning with Python', 'François Chollet', 2021, 4.7]
  ];
  const stmt = db.prepare('INSERT INTO books(title,author,year,rating) VALUES (?,?,?,?)');
  const tx = db.transaction(rows => rows.forEach(r => stmt.run(...r)));
  tx(seed);
  console.log(`Seeded ${seed.length} books`);
}

// App
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// List + simple search ?q=
app.get('/books', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) {
    return res.json(db.prepare('SELECT * FROM books ORDER BY id DESC').all());
  }
  const rows = db.prepare(`
    SELECT * FROM books
    WHERE lower(title) LIKE ? OR lower(author) LIKE ?
    ORDER BY id DESC
  `).all(`%${q}%`, `%${q}%`);
  res.json(rows);
});

// Read one
app.get('/books/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Create
app.post('/books', (req, res) => {
  const { title, author, year, rating } = req.body || {};
  if (!title || !author) return res.status(400).json({ error: 'title and author are required' });
  const info = db.prepare('INSERT INTO books(title,author,year,rating) VALUES (?,?,?,?)')
                 .run(title, author, year ?? null, rating ?? null);
  const created = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// Update (partial)
app.put('/books/:id', (req, res) => {
  const exists = db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Not found' });
  const { title, author, year, rating } = req.body || {};
  db.prepare(`UPDATE books SET
      title = COALESCE(?, title),
      author = COALESCE(?, author),
      year = COALESCE(?, year),
      rating = COALESCE(?, rating)
    WHERE id = ?`).run(title ?? null, author ?? null, year ?? null, rating ?? null, req.params.id);
  const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete
app.delete('/books/:id', (req, res) => {
  const info = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Books API listening on http://0.0.0.0:${PORT}`);
});
