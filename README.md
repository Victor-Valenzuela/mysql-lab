# SQL_Lab — Interactive MySQL Exercises

Browser-based interactive SQL learning platform. Users write MySQL queries that are transparently executed against a real SQLite database via WebAssembly. No backend required.

## How It Works

1. User writes a MySQL query in the editor
2. A transformation layer converts MySQL syntax to SQLite transparently
3. sql.js (SQLite compiled to WebAssembly) executes the query in the browser
4. The result is compared against the expected output to validate the answer

The user never knows SQLite is involved — they write pure MySQL.

## Features

- 87 progressive exercises across 10 categories
- Real database with 9,000+ records (hospital system)
- MySQL syntax accepted and transformed to SQLite silently
- Instant validation by comparing query results
- CodeMirror editor with SQL syntax highlighting
- Theory block before each exercise explaining the concept
- Section intro pages with explanations
- Progress tracking with localStorage
- Navigation guards (must complete before advancing)
- Dark/Light mode toggle
- Responsive design (desktop + mobile)
- Completion screen after finishing all exercises

## Exercise Categories

1. **DDL & Structure** — CREATE TABLE, constraints, FK, CASCADE, ALTER, DROP, RENAME, DEFAULT
2. **DML Basic** — INSERT, UPDATE, DELETE, INSERT SELECT, subconsultas en DML
3. **SELECT & WHERE** — Filters, LIKE, IN, BETWEEN, IS NULL, AND/OR, DISTINCT, NOT IN, !=
4. **ORDER BY & LIMIT** — Sorting, pagination, multiple columns
5. **Aggregation** — COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING, DISTINCT count
6. **JOINs** — INNER, LEFT, multi-table, Self JOIN, with aggregation
7. **Subqueries & CTEs** — WHERE subqueries, EXISTS, NOT EXISTS, FROM subqueries, WITH
8. **Date Functions** — YEAR, MONTH, BETWEEN dates, DATE_SUB, DATEDIFF
9. **Optimization & Control** — INDEX, VIEWS, Transactions, UNION
10. **DCL & Permissions** — CREATE USER, GRANT, REVOKE, DROP USER

## Dataset

Hospital database with 10 interconnected tables:

| Table         | Records | Description               |
| ------------- | ------- | ------------------------- |
| patients      | 500     | Patient demographics      |
| doctors       | 50      | Staff and specializations |
| departments   | 12      | Hospital departments      |
| appointments  | 2,000   | Scheduled visits          |
| diagnoses     | 1,500   | Medical diagnoses         |
| medications   | 200     | Drug catalog              |
| prescriptions | 3,000   | Prescribed treatments     |
| rooms         | 100     | Hospital rooms            |
| admissions    | 800     | Patient stays             |
| invoices      | 1,000   | Billing records           |

## Stack

- [Astro](https://astro.build/) v6 — Static site framework
- [Tailwind CSS](https://tailwindcss.com/) v4 — Styling
- [sql.js](https://sql.js.org/) — SQLite compiled to WebAssembly
- [CodeMirror](https://codemirror.net/) 6 — SQL editor
- Firebase Hosting — Deployment

## Local Development

```bash
npm install
npm run dev          # Start dev server at localhost:4321/sql-lab/
npm run build        # Production build to ./dist/
npm run preview      # Preview production build
```

## Deployment (Firebase Hosting)

The project deploys as two separate Firebase Hosting sites within the same project:

| Site       | URL                | Language |
| ---------- | ------------------ | -------- |
| sql-lab-es | sql-lab-es.web.app | Spanish  |
| sql-lab-de | sql-lab-de.web.app | German   |

### Setup Steps

1. **Install Firebase CLI** (if not already):

```bash
npm install -g firebase-tools
firebase login
```

2. **Initialize Firebase in the project**:

```bash
firebase init hosting
```

Select your existing project when prompted.

3. **Add multiple sites** to your Firebase project:

```bash
firebase hosting:sites:create sql-lab-es
firebase hosting:sites:create sql-lab-de
```

4. **Configure `firebase.json`**:

```json
{
  "hosting": [
    {
      "site": "sql-lab-es",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "site": "sql-lab-de",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

5. **Before deploying, change `base` in `astro.config.mjs`**:

```js
base: '/',  // Change from '/sql-lab' to '/' for Firebase
```

6. **Deploy Spanish version**:

```bash
npm run build
firebase deploy --only hosting:sql-lab-es
```

7. **Deploy German version** (after translating):

```bash
npm run build
firebase deploy --only hosting:sql-lab-de
```

### Important Notes

- The `base: '/sql-lab'` in `astro.config.mjs` is for GitHub Pages. For Firebase, change it to `'/'` before building.
- Each site gets its own `.web.app` subdomain automatically.
- You can also connect custom domains in the Firebase console.
- The `rewrites` rule ensures client-side routing works for all paths.

## Language Switching (i18n)

The entire project switches language by changing a single line in `src/i18n/index.ts`:

```ts
const LANG = "es"; // 'es' = español, 'de' = alemán
```

This controls everything: UI texts, section introductions, and exercise content (titles, descriptions, theories, hints).

**Files:**

- `src/i18n/index.ts` — Language selector (change LANG here)
- `src/i18n/es.json` / `de.json` — UI texts
- `src/i18n/intros-es.json` / `intros-de.json` — Section introductions
- `src/data/exercises-es.json` / `exercises-de.json` — Exercise content

**Deploy workflow:**

1. Set `LANG` to the desired language in `src/i18n/index.ts`
2. Build and deploy:

```bash
npm run build
firebase deploy --only hosting:sql-lab-es   # Spanish
firebase deploy --only hosting:sql-lab-de   # German
```

**Note:** In dev mode (`npm run dev`), restart the server after changing `LANG` for JSON changes to take effect. For production builds this is not needed.

## MySQL → SQLite Transformation

The transformer handles these conversions silently:

| MySQL                         | SQLite                           |
| ----------------------------- | -------------------------------- |
| `AUTO_INCREMENT`              | `AUTOINCREMENT`                  |
| `INT`, `BIGINT`, `TINYINT`    | `INTEGER`                        |
| `VARCHAR(n)`, `CHAR(n)`       | `TEXT`                           |
| `DOUBLE`, `FLOAT`, `DECIMAL`  | `REAL`                           |
| `DATETIME`, `TIMESTAMP`       | `TEXT`                           |
| `NOW()`                       | `datetime('now')`                |
| `YEAR(col)`                   | `strftime('%Y', col)`            |
| `MONTH(col)`                  | `strftime('%m', col)`            |
| `DATE_SUB(d, INTERVAL n DAY)` | `date(d, '-n days')`             |
| `LIMIT 5, 10`                 | `LIMIT 10 OFFSET 5`              |
| `SHOW TABLES`                 | `SELECT name FROM sqlite_master` |
| `DESCRIBE table`              | `PRAGMA table_info(table)`       |
| Backticks                     | Removed                          |
| `ENGINE=InnoDB`               | Removed                          |
