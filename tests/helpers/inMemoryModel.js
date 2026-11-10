import { getTableColumns, is, SQL } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/mysql-core';
import { ConflictError } from '../../src/errors.js';

/**
 * Creates a REAL model instance whose BaseModel storage methods
 * (findById, findAll, insertRecord, updateRecord, deleteRecord) use an in-memory table.
 *
 * - The model's own code (normalisation, validation, toRecord) runs unchanged.
 * - Table rules are read from the Drizzle schema: auto-increment, defaults,
 *   NOT NULL, varchar length, UNIQUE columns and unique indexes.
 * - Custom selects that use `this.db` directly are NOT emulated: they throw a clear
 *   error. Stub them with t.mock.method(...) or cover them in tests/integration/.
 *
 * Works for any class that extends BaseModel. No per-model fake is needed.
 *
 *   const { model, auditLog, rows, seed } = createInMemoryModel(UserModel);
 */
export function createInMemoryModel(ModelClass, ...extraConstructorArgs) {
  const model = new ModelClass(createGuardDb(ModelClass.name), ...extraConstructorArgs);
  const table = createInMemoryTable(model.table);
  const auditLog = [];

  const toRecord = (row) => (row ? model.toRecord(structuredClone(row)) : null);
  const audit = (operationType, primaryKeyId, changeData) => {
    auditLog.push({
      operationType,
      dbSchema: model.constructor.name,
      tableName: model.tableName,
      primaryKeyId: Number(primaryKeyId),
      changeData: changeData == null ? null : structuredClone(changeData),
    });
  };

  // Own properties on this one instance override BaseModel's prototype methods.
  // The model source files are never modified.
  Object.assign(model, {
    async findById(id) {
      return toRecord(table.get(id));
    },

    async findAll() {
      return table.all().map(toRecord);
    },

    async insertRecord(payload, { conflictMessage = 'Record already exists' } = {}) {
      if (!payload || typeof payload !== 'object') {
        throw new Error(`[${model.constructor.name}] insertRecord requires a payload object.`);
      }
      const row = table.insert(payload, conflictMessage);
      audit('INSERT', row[table.primaryKey], payload);
      return toRecord(row);
    },

    async updateRecord(id, payload, { conflictMessage = 'Record already exists' } = {}) {
      if (!id || !payload || typeof payload !== 'object') {
        throw new Error(`[${model.constructor.name}] updateRecord requires an id and a payload object.`);
      }
      const row = table.update(id, payload, conflictMessage);
      if (!row) return null;
      audit('UPDATE', id, payload);
      return toRecord(row);
    },

    async deleteRecord(id) {
      if (!id) {
        throw new Error(`[${model.constructor.name}] deleteRecord requires an id.`);
      }
      const deleted = table.delete(id);
      if (deleted) audit('DELETE', id, null);
      return deleted;
    },
  });

  return {
    model,
    auditLog,
    /** Raw stored rows (column keys as in the schema), for assertions. */
    rows: () => table.all().map((row) => structuredClone(row)),
    /** Insert rows directly, without auditing, to set up a test. */
    seed: (rows) => rows.forEach((row) => table.insert(row)),
  };
}

/* ------------------------------------------------------------------ */

/** A stand-in for `db` that fails loudly and clearly if a custom query uses it. */
function createGuardDb(modelName) {
  return new Proxy({}, {
    get(_, prop) {
      // Allow inspection (console.log, await checks) without throwing.
      if (typeof prop === 'symbol' || prop === 'then') return undefined;
      throw new Error(
        `[inMemoryModel] ${modelName} used this.db.${prop}, a custom query that is not emulated in memory. ` +
        'Stub that method in this test with t.mock.method(...), or test it in tests/integration/.',
      );
    },
  });
}

/** An in-memory table that enforces the rules declared in a Drizzle MySQL schema. */
function createInMemoryTable(drizzleTable) {
  const columns = Object.entries(getTableColumns(drizzleTable)); // [jsKey, Column]
  const keyForDbName = new Map(columns.map(([key, col]) => [col.name, key]));

  const primary = columns.find(([, col]) => col.primary);
  if (!primary) throw new Error('[inMemoryModel] table has no primary key.');
  const [primaryKey, primaryColumn] = primary;

  const config = getTableConfig(drizzleTable);
  const uniqueKeySets = [
    ...columns.filter(([, col]) => col.isUnique).map(([key]) => [key]),
    ...config.indexes
      .filter((index) => index.config.unique)
      .map((index) => index.config.columns.map((col) => keyForDbName.get(col.name))),
    ...config.uniqueConstraints.map((u) => u.columns.map((col) => keyForDbName.get(col.name))),
  ];

  const rows = new Map();
  let nextId = 1;

  // All primary keys in this project are auto-increment integers.
  const normaliseId = (id) => Number(id);

  function withDefaults(payload) {
    const row = {};
    for (const [key, col] of columns) {
      let value = payload[key];
      if (value === undefined) {
        if (key === primaryKey && primaryColumn.autoIncrement) value = nextId;
        else if (typeof col.defaultFn === 'function') value = col.defaultFn();
        else if (col.hasDefault && is(col.default, SQL)) value = sqlDefault(col);
        else if (col.hasDefault) value = structuredClone(col.default);
      }
      row[key] = value ?? null;
    }
    return row;
  }

  function validate(row, conflictMessage, ignoreId) {
    for (const [key, col] of columns) {
      const value = row[key];
      if (col.notNull && value == null) {
        throw mysqlError('ER_BAD_NULL_ERROR', `Column '${col.name}' cannot be null`);
      }
      if (col.length && typeof value === 'string' && value.length > col.length) {
        throw mysqlError('ER_DATA_TOO_LONG', `Data too long for column '${col.name}'`);
      }
    }
    for (const keys of uniqueKeySets) {
      if (keys.some((key) => row[key] == null)) continue; // MySQL allows repeated NULLs
      const clash = [...rows.values()].find(
        (other) => other[primaryKey] !== ignoreId && keys.every((key) => sameValue(other[key], row[key])),
      );
      if (clash) {
        throw new ConflictError(conflictMessage ?? 'Record already exists', {
          cause: mysqlError('ER_DUP_ENTRY', `Duplicate entry for ${keys.join(', ')}`),
        });
      }
    }
  }

  return {
    primaryKey,

    get(id) {
      return rows.get(normaliseId(id)) ?? null;
    },

    all() {
      return [...rows.values()];
    },

    insert(payload, conflictMessage) {
      const row = withDefaults(payload);
      validate(row, conflictMessage);
      rows.set(row[primaryKey], structuredClone(row));
      nextId = Math.max(nextId, row[primaryKey] + 1);
      return row;
    },

    update(id, payload, conflictMessage) {
      const existing = rows.get(normaliseId(id));
      if (!existing) return null;
      const changes = Object.fromEntries(
        Object.entries(payload).filter(([key]) => columns.some(([k]) => k === key)),
      );
      const updated = { ...existing, ...changes };
      validate(updated, conflictMessage, existing[primaryKey]);
      rows.set(existing[primaryKey], structuredClone(updated));
      return updated;
    },

    delete(id) {
      return rows.delete(normaliseId(id));
    },
  };
}

function sqlDefault(col) {
  if (col.columnType === 'MySqlTimestamp' || col.columnType === 'MySqlDateTime') {
    return new Date(); // defaultNow()
  }
  throw new Error(
    `[inMemoryModel] column '${col.name}' has a SQL default that is not emulated. Extend sqlDefault() for it.`,
  );
}

// Approximates MySQL's default utf8mb4_0900_ai_ci collation:
// case- and accent-insensitive comparison for strings.
function sameValue(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;
  }
  return a === b;
}

function mysqlError(code, message) {
  return Object.assign(new Error(message), { code });
}
