/**
 * Transforms MySQL syntax to SQLite-compatible syntax.
 * Handles the most common differences transparently.
 */
export function mysqlToSqlite(query: string): string {
    let q = query.trim();

    // SHOW TABLES → SQLite equivalent
    if (/^\s*SHOW\s+TABLES\s*;?\s*$/i.test(q)) {
        return "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
    }

    // SHOW DATABASES → not applicable in SQLite, return a helpful result
    if (/^\s*SHOW\s+DATABASES\s*;?\s*$/i.test(q)) {
        return "SELECT 'hospital' AS Database";
    }

    // DESCRIBE / DESC table → SQLite PRAGMA
    const descMatch = q.match(/^\s*(?:DESCRIBE|DESC)\s+(\w+)\s*;?\s*$/i);
    if (descMatch) {
        return `PRAGMA table_info(${descMatch[1]})`;
    }

    // AUTO_INCREMENT → AUTOINCREMENT
    q = q.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');

    // INT types → INTEGER
    q = q.replace(/\b(TINY|SMALL|MEDIUM|BIG)?INT\b(\(\d+\))?/gi, 'INTEGER');

    // VARCHAR(n), CHAR(n), TEXT → TEXT
    q = q.replace(/\b(VAR)?CHAR\(\d+\)/gi, 'TEXT');
    q = q.replace(/\bTINYTEXT\b/gi, 'TEXT');
    q = q.replace(/\bMEDIUMTEXT\b/gi, 'TEXT');
    q = q.replace(/\bLONGTEXT\b/gi, 'TEXT');

    // DOUBLE, FLOAT, DECIMAL → REAL
    q = q.replace(/\b(DOUBLE|FLOAT)\b(\(\d+(,\s*\d+)?\))?/gi, 'REAL');
    q = q.replace(/\bDECIMAL\b(\(\d+(,\s*\d+)?\))?/gi, 'REAL');

    // BOOLEAN → INTEGER
    q = q.replace(/\bBOOLEAN\b/gi, 'INTEGER');
    q = q.replace(/\bBOOL\b/gi, 'INTEGER');

    // DATETIME, TIMESTAMP → TEXT (SQLite stores dates as text)
    q = q.replace(/\bDATETIME\b/gi, 'TEXT');
    q = q.replace(/\bTIMESTAMP\b/gi, 'TEXT');
    q = q.replace(/\bDATE\b(?!\()/gi, 'TEXT');
    q = q.replace(/\bTIME\b(?!\()/gi, 'TEXT');

    // ENUM('a','b') → TEXT CHECK(col IN ('a','b'))
    q = q.replace(
        /(\w+)\s+ENUM\(([^)]+)\)/gi,
        (_, col, values) => `${col} TEXT CHECK(${col} IN (${values}))`
    );

    // NOW() → datetime('now')
    q = q.replace(/\bNOW\(\)/gi, "datetime('now')");

    // CURDATE() → date('now')
    q = q.replace(/\bCURDATE\(\)/gi, "date('now')");

    // CURTIME() → time('now')
    q = q.replace(/\bCURTIME\(\)/gi, "time('now')");

    // YEAR(col) → strftime('%Y', col)
    q = q.replace(/\bYEAR\(([^)]+)\)/gi, "strftime('%Y', $1)");

    // MONTH(col) → strftime('%m', col)
    q = q.replace(/\bMONTH\(([^)]+)\)/gi, "strftime('%m', $1)");

    // DAY(col) → strftime('%d', col)
    q = q.replace(/\bDAY\(([^)]+)\)/gi, "strftime('%d', $1)");

    // DATE_SUB(date, INTERVAL n DAY) → date(date, '-n days')
    q = q.replace(
        /\bDATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi,
        "date($1, '-$2 days')"
    );

    // DATE_ADD(date, INTERVAL n DAY) → date(date, '+n days')
    q = q.replace(
        /\bDATE_ADD\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi,
        "date($1, '+$2 days')"
    );

    // CURRENT_DATE or CURRENT_DATE() → date('now')
    q = q.replace(/\bCURRENT_DATE\(\)/gi, "date('now')");
    q = q.replace(/\bCURRENT_DATE\b/gi, "date('now')");
    // IF(cond, a, b) → CASE WHEN cond THEN a ELSE b END
    q = q.replace(
        /\bIF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi,
        'CASE WHEN $1 THEN $2 ELSE $3 END'
    );

    // IFNULL → IFNULL (same in both, no change needed)

    // LIMIT offset, count → LIMIT count OFFSET offset
    q = q.replace(
        /LIMIT\s+(\d+)\s*,\s*(\d+)/gi,
        'LIMIT $2 OFFSET $1'
    );

    // Remove backticks (MySQL quoting) → bare identifiers
    q = q.replace(/`/g, '');

    // UNSIGNED → remove (SQLite doesn't support it)
    q = q.replace(/\bUNSIGNED\b/gi, '');

    // MODIFY COLUMN → not supported in SQLite, skip silently
    if (/ALTER\s+TABLE\s+\w+\s+MODIFY\s+COLUMN/i.test(q)) {
        // SQLite doesn't support MODIFY COLUMN, return as-is (will be handled in validation)
        return q;
    }

    // ENGINE=InnoDB or similar → remove
    q = q.replace(/\bENGINE\s*=\s*\w+/gi, '');

    // DEFAULT CHARSET=utf8 → remove
    q = q.replace(/\b(DEFAULT\s+)?(CHARSET|CHARACTER\s+SET)\s*=\s*\w+/gi, '');

    // COLLATE → remove
    q = q.replace(/\bCOLLATE\s+\w+/gi, '');

    // ON UPDATE CURRENT_TIMESTAMP → remove (not supported in SQLite)
    q = q.replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, '');

    // CURRENT_TIMESTAMP → datetime('now')
    q = q.replace(/\bCURRENT_TIMESTAMP\b/gi, "datetime('now')");

    // Remove trailing commas before closing parenthesis (common after removing clauses)
    q = q.replace(/,\s*\)/g, ')');

    // Clean up multiple spaces
    q = q.replace(/  +/g, ' ');

    return q.trim();
}
