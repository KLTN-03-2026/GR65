require('dotenv').config();
const { Pool } = require('pg');

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

pgPool.on('connect', () => console.log('Connected to PostgreSQL'));
pgPool.on('error', (err) => { console.error('PG idle client error', err); process.exit(-1); });

// ── Compatibility shim: mssql-like API backed by pg ──
// This allows existing code using `const { sql, poolPromise } = require('./db')` to work with PostgreSQL
// with minimal changes. Only SQL syntax (GETDATE→NOW, TOP→LIMIT, etc.) needs manual fixing in queries.

const sql = {
  NVarChar: 'text', VarChar: 'text', Int: 'int4', BigInt: 'int8', Float: 'float8',
  Bit: 'bool', UniqueIdentifier: 'uuid', DateTime: 'timestamptz', DateTime2: 'timestamptz',
  Decimal: 'numeric', NText: 'text', Text: 'text',
  Transaction: class {
    constructor(pool) { this._pool = pool; this._client = null; }
    async begin() { this._client = await pgPool.connect(); await this._client.query('BEGIN'); }
    async commit() { await this._client.query('COMMIT'); this._client.release(); }
    async rollback() { await this._client.query('ROLLBACK'); this._client.release(); }
    request() { return createRequest(this._client); }
  }
};

function createRequest(clientOrPool) {
  const target = clientOrPool || pgPool;
  const inputs = {};
  const req = {
    input(name, _typeOrValue, value) {
      const val = value !== undefined ? value : _typeOrValue;
      inputs[name] = val;
      return req;
    },
    async query(sqlText) {
      // Convert @ParamName to $N
      const paramNames = [];
      const converted = sqlText.replace(/@(\w+)/g, (match, name) => {
        // Check if this param was registered via .input()
        // Case-insensitive lookup
        const key = Object.keys(inputs).find(k => k.toLowerCase() === name.toLowerCase());
        if (key !== undefined) {
          let idx = paramNames.indexOf(key);
          if (idx === -1) { paramNames.push(key); idx = paramNames.length - 1; }
          return '$' + (idx + 1);
        }
        return match; // leave as-is if not a registered param (e.g. @@ROWCOUNT)
      });
      const values = paramNames.map(n => inputs[n]);
      const result = await target.query(converted, values);
      return {
        recordset: result.rows,
        recordsets: [result.rows],
        rowsAffected: [result.rowCount],
        output: {}
      };
    }
  };
  return req;
}

const poolPromise = Promise.resolve({
  request() { return createRequest(pgPool); },
  close() { return pgPool.end(); }
});

// Also export the raw pg pool for new-style code
module.exports = { sql, poolPromise, pool: pgPool };
