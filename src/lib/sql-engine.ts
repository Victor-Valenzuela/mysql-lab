// @ts-ignore
import initSqlJs from 'sql.js';
import { mysqlToSqlite } from './mysql-to-sqlite';
// @ts-ignore
import t from '../i18n/index.ts';

let db: any = null;
let SQL: any = null;
let dbBuffer: Uint8Array | null = null;
let baseUrl = '/';

export interface QueryResult {
    columns: string[];
    rows: any[][];
    rowCount: number;
    error?: string;
}

export interface ValidationResult {
    correct: boolean;
    userResult: QueryResult;
    expectedResult: QueryResult;
    message: string;
}

/**
 * Initialize sql.js and load the hospital database
 */
export async function initDatabase(base: string = '/'): Promise<void> {
    baseUrl = base;

    SQL = await initSqlJs({
        locateFile: (file: string) => `${baseUrl}${file}`
    });

    const url = `${baseUrl}hospital.sqlite`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`No se pudo cargar la base de datos desde ${url} (${response.status})`);
    }
    const buffer = await response.arrayBuffer();
    dbBuffer = new Uint8Array(buffer);
    db = new SQL.Database(new Uint8Array(dbBuffer));
}

/**
 * Execute a MySQL query (transformed to SQLite internally)
 */
export function executeQuery(mysqlQuery: string): QueryResult {
    if (!db) {
        return { columns: [], rows: [], rowCount: 0, error: t.validation.dbNotLoaded };
    }

    if (!mysqlQuery.trimEnd().endsWith(';')) {
        return { columns: [], rows: [], rowCount: 0, error: t.validation.semicolonRequired };
    }

    try {
        const sqliteQuery = mysqlToSqlite(mysqlQuery);
        const results = db.exec(sqliteQuery);

        if (results.length === 0) {
            const changes = db.getRowsModified();
            return {
                columns: [t.validation.rowsAffected],
                rows: [[changes]],
                rowCount: changes
            };
        }

        const result = results[results.length - 1];
        return {
            columns: result.columns,
            rows: result.values,
            rowCount: result.values.length
        };
    } catch (e: any) {
        return {
            columns: [],
            rows: [],
            rowCount: 0,
            error: e.message || 'Error desconocido'
        };
    }
}

/**
 * Determine if a query is a SELECT-type that returns comparable tabular results.
 */
function isSelectQuery(query: string): boolean {
    const trimmed = query.trim().replace(/^WITH\s+/i, 'WITH ');
    return /^\s*(SELECT|WITH)\b/i.test(trimmed);
}

/**
 * Normalize a SQL query for text comparison.
 * Handles whitespace, casing, trailing semicolons, and minor formatting differences.
 */
function normalizeQuery(query: string): string {
    return query
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/;\s*$/, '')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\s*,\s*/g, ', ');
}

/**
 * Execute a query on a fresh copy of the database (isolated, doesn't affect main db).
 */
function executeOnFreshDb(mysqlQuery: string): QueryResult {
    if (!SQL || !dbBuffer) {
        return { columns: [], rows: [], rowCount: 0, error: t.validation.dbNotLoaded };
    }

    const freshDb = new SQL.Database(new Uint8Array(dbBuffer));
    try {
        const sqliteQuery = mysqlToSqlite(mysqlQuery);
        const results = freshDb.exec(sqliteQuery);

        if (results.length === 0) {
            const changes = freshDb.getRowsModified();
            return {
                columns: [t.validation.rowsAffected],
                rows: [[changes]],
                rowCount: changes
            };
        }

        const result = results[results.length - 1];
        return {
            columns: result.columns,
            rows: result.values,
            rowCount: result.values.length
        };
    } catch (e: any) {
        return {
            columns: [],
            rows: [],
            rowCount: 0,
            error: e.message || 'Error desconocido'
        };
    } finally {
        freshDb.close();
    }
}

/**
 * Validate user query against expected query.
 *
 * Strategy:
 * - SELECT queries: execute both on a fresh DB and compare results
 * - DDL/DML queries: compare normalized text (syntax check)
 */
export function validateQuery(userQuery: string, expectedQuery: string): ValidationResult {
    // Require semicolon
    if (!userQuery.trimEnd().endsWith(';')) {
        const errorResult: QueryResult = { columns: [], rows: [], rowCount: 0, error: t.validation.semicolonRequired };
        return {
            correct: false,
            userResult: errorResult,
            expectedResult: errorResult,
            message: t.validation.semicolonRequired
        };
    }

    if (isSelectQuery(expectedQuery)) {
        // Execute both on fresh DB copies to avoid state issues
        const userResult = executeOnFreshDb(userQuery);
        const expectedResult = executeOnFreshDb(expectedQuery);

        if (userResult.error) {
            return {
                correct: false,
                userResult,
                expectedResult,
                message: `Error: ${userResult.error}`
            };
        }

        // Compare columns
        const colsMatch = JSON.stringify(userResult.columns) === JSON.stringify(expectedResult.columns);

        // Compare rows (sort for order-independent comparison)
        const userSorted = JSON.stringify(userResult.rows.map(r => JSON.stringify(r)).sort());
        const expectedSorted = JSON.stringify(expectedResult.rows.map(r => JSON.stringify(r)).sort());
        const rowsMatch = userSorted === expectedSorted;

        if (colsMatch && rowsMatch) {
            return {
                correct: true,
                userResult,
                expectedResult,
                message: t.validation.correct
            };
        }

        let message = t.validation.incorrect;
        if (!colsMatch) {
            message += `${t.validation.expectedColumns}: ${expectedResult.columns.join(', ')}. `;
        }
        if (!rowsMatch) {
            message += `${t.validation.expected}: ${expectedResult.rowCount} ${t.exercise.rows}. ${t.validation.obtained}: ${userResult.rowCount} ${t.exercise.rows}.`;
        }

        return { correct: false, userResult, expectedResult, message };
    }

    // DDL/DML: compare normalized query text
    const normalizedUser = normalizeQuery(userQuery);
    const normalizedExpected = normalizeQuery(expectedQuery);
    const correct = normalizedUser === normalizedExpected;

    const okResult: QueryResult = { columns: ['Resultado'], rows: [['OK']], rowCount: 1 };
    const failResult: QueryResult = { columns: ['Resultado'], rows: [['Error']], rowCount: 1 };

    return {
        correct,
        userResult: correct ? okResult : failResult,
        expectedResult: okResult,
        message: correct
            ? t.validation.correctSyntax
            : t.validation.incorrectSyntax
    };
}

/**
 * Reset database to original state (reload from buffer)
 */
export async function resetDatabase(): Promise<void> {
    if (db) db.close();
    if (SQL && dbBuffer) {
        db = new SQL.Database(new Uint8Array(dbBuffer));
    } else {
        db = null;
        await initDatabase(baseUrl);
    }
}
