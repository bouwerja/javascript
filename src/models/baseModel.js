import { db, eventLog } from "../db/index.js";
import { eq, getTableName } from "drizzle-orm";

export class BaseModel {
    constructor(data) {
        this.id = data.id;
        this.createdAt = data.createdAt;
    }

    toJSON() {
        return {
            ...this
        };
    }

    static async logOperations({ action, caller, tableName, recordId = null, details = null }) {

        try {

            if (!recordId) {
                throw new Error("[BaseMode] Record affect is NULL.");
            }

            await db.insert(eventLog).values({
                operationType: action,
                dbSchema: caller,
                tableName,
                primaryKeyId: Number(recordId),
                changeData: typeof details === 'object' ? JSON.stringify(details) : details,
            });
        } catch (error) {
            console.error('[BaseModel] Fialed to write to event log:\n', error.message);
        }
    }

    static async insertRecord(tableSchema, payload) {
        
        if (!tableSchema || !payload) {
            throw new Error("Missing values in INSERT:\n" + `TableSchema: ${tableSchema}\n` + `Payload: ${payload}\n`);
        }

        const result = await db.insert(tableSchema).values(payload);
        const insertedId = result.lastInsertRowid || result.insertId || result.id;
        const tableName = getTableName(tableSchema);

        const caller = `${this.name}`;

        await this.logOperations({
            action: 'INSERT',
            caller,
            tableName,
            recordId: insertedId,
            details: payload,
        });

        return { id: insertedId, ...payload };
    }

    static async updateRecord(tableSchema, id, payload) {

        if (!tableSchema || !id || !payload) {
            throw new Error("[BaseModel] Missing values in UPDATE:\n" + `TableSchema: ${tableSchema}\n` + `ID: ${id}\n` + `Payload: ${payload}\n`);
        }

        await db.update(tableSchema).set(payload).where(eq(tableSchema.id, id));

        const caller = `${this.name}`;
        const tableName = getTableName(tableSchema);

        await this.logOperations({
            action: 'UPDATE',
            caller,
            tableName,
            recordId: id,
            details: payload,
        });

        return { id, ...payload };
    }

    static async deleteRecord(tableSchema, id) {
        if (!tableSchema || !id) {
            throw new Error("[BaseModel] Missing values in DELETE:\n" + `TableSchema: ${tableSchema}\n` + `ID: ${id}\n`);
        }

        await db.delete(tableSchema).where(eq(tableSchema.id, id));

        const caller = `${this.name}`;
        const tableName = getTableName(tableSchema);

        await this.logOperations({
            action: 'DELETE',
            caller,
            tableName,
            recordId: id,
        });

        return true;
    }
}