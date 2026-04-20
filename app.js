const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./survey.db');

// テーブル作成（初回のみ）
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      q1 TEXT,
      q2 TEXT,
      q3 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

const DATA_FILE = './data.json';

// 初期化
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// 読み込み
function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// 書き込み
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// フォーム
app.get('/', (req, res) => {
  res.send(`
    <h1>アンケート</h1>
    <form method="POST" action="/submit">

      <p>お名前</p>
      <input type="text" name="name" required>

      <p>Q1. 性別</p>
      <label><input type="radio" name="q1" value="男性" required>男性</label>
      <label><input type="radio" name="q1" value="女性">女性</label>
      <label><input type="radio" name="q1" value="その他">その他</label>

      <p>Q2. 年齢層</p>
      <select name="q2" required>
        <option value="">選択してください</option>
        <option value="10代">10代</option>
        <option value="20代">20代</option>
        <option value="30代">30代</option>
        <option value="40代以上">40代以上</option>
      </select>

      <p>Q3. 満足度</p>
      <label><input type="radio" name="q3" value="満足" required>満足</label>
      <label><input type="radio" name="q3" value="普通">普通</label>
      <label><input type="radio" name="q3" value="不満">不満</label>

      <br><br>
      <button type="submit">送信</button>
    </form>

    <p><a href="/results">結果を見る</a></p>
  `);
});


// 送信処理
app.post('/submit', (req, res) => {
  const { name, q1, q2, q3 } = req.body;

  if (!name || !q1 || !q2 || !q3) {
    return res.send('未入力項目があります');
  }

  db.run(
    `INSERT INTO responses (name, q1, q2, q3) VALUES (?, ?, ?, ?)`,
    [name, q1, q2, q3],
    (err) => {
      if (err) return res.send('保存エラー');

      res.send(`
        <p>送信ありがとうございました</p>
        <a href="/">戻る</a>
      `);
    }
  );
});

// 結果表示（個別＋集計）
app.get('/results', (req, res) => {
  db.all(`SELECT * FROM responses`, (err, rows) => {
    if (err) return res.send('取得エラー');

    const summary = { q1: {}, q2: {}, q3: {} };

    rows.forEach(d => {
      summary.q1[d.q1] = (summary.q1[d.q1] || 0) + 1;
      summary.q2[d.q2] = (summary.q2[d.q2] || 0) + 1;
      summary.q3[d.q3] = (summary.q3[d.q3] || 0) + 1;
    });

    const list = rows.map(d => `
      <tr>
        <td>${d.name}</td>
        <td>${d.q1}</td>
        <td>${d.q2}</td>
        <td>${d.q3}</td>
        <td>${d.created_at}</td>
      </tr>
    `).join('');

    res.send(`
      <h1>回答一覧</h1>
      <table border="1">
        <tr>
          <th>名前</th><th>性別</th><th>年齢層</th><th>満足度</th><th>日時</th>
        </tr>
        ${list}
      </table>

      <h2>集計</h2>
      <pre>${JSON.stringify(summary, null, 2)}</pre>

      <a href="/">戻る</a>
    `);
  });
});

// 起動
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});