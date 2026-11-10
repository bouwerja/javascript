import { eq, getTableName } from 'drizzle-orm';
import { eventLog } from '../db/eventLog.js';
import { ConflictError } from '../errors.js';


export class BaseModel {
  constructor(db, table) {
    if (new.target === BaseModel) {
      throw new Error('BaseModel is abstract; extend it instead.');
    }
    if (!db || !table) {
      throw new Error(`[${new.target.name}] db and table are required.`);
    }
    this.db = db;
    this.table = table;
    this.tableName = getTableName(table);
  }


  toRecord(row) {
    return { ...row };
  }


  async findById(id) {
    const [row] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id));

    return row ? this.toRecord(row) : null;
  }

  async findAll() {

    const rows = await this.db.select().from(this.table);

    return rows.map((row) => this.toRecord(row));
  }


  async insertRecord(payload, { conflictMessage = 'Record already exists' } = {}) {
    if (!payload || typeof payload !== 'object') {
      throw new Error(`[${this.constructor.name}] insertRecord requires a payload object.`);
    }

    try {
      const id = await this.db.transaction(async (tx) => {

        const [{ id: newId }] = await tx.insert(this.table).values(payload).$returningId();

        await this.#audit(tx, 'INSERT', newId, payload);

        return newId;
      });
      return this.findById(id);
    } catch (err) {
      if (isDuplicateKey(err)) throw new ConflictError(conflictMessage, { cause: err });
      throw err;
    }
  }

  async updateRecord(id, payload, { conflictMessage = 'Record already exists' } = {}) {
    if (!id || !payload || typeof payload !== 'object') {
      throw new Error(`[${this.constructor.name}] updateRecord requires an id and a payload object.`);
    }

    try {
      const updated = await this.db.transaction(async (tx) => {
        const [result] = await tx.update(this.table).set(payload).where(eq(this.table.id, id));
        
        if (result.affectedRows === 0) return false;

        await this.#audit(tx, 'UPDATE', id, payload);

        return true;
      });
      return updated ? this.findById(id) : null;
    } catch (err) {
      if (isDuplicateKey(err)) throw new ConflictError(conflictMessage, { cause: err });
      throw err;
    }
  }

  async deleteRecord(id) {
    if (!id) {
      throw new Error(`[${this.constructor.name}] deleteRecord requires an id.`);
    }

    return this.db.transaction(async (tx) => {

      const [result] = await tx.delete(this.table).where(eq(this.table.id, id));

      if (result.affectedRows === 0) return false;

      await this.#audit(tx, 'DELETE', id, null);

      return true;
    });
  }


  async #audit(tx, action, recordId, details) {
    await tx.insert(eventLog).values({
      operationType: action,
      dbSchema: this.constructor.name,
      tableName: this.tableName,
      primaryKeyId: Number(recordId),
      changeData: details,
    });
  }
}

function isDuplicateKey(err) {
  return err?.code === 'ER_DUP_ENTRY' || err?.cause?.code === 'ER_DUP_ENTRY';
}
