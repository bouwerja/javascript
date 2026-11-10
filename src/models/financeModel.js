import { BaseModel } from "./baseModel.js";

export class FinanceModel extends BaseModel {
    constructor({ id, createdAt }) {
        super({ id, createdAt });
    }

      toRecord(row) {
    return {
      id: row.id,
      details: row.details,
      createdAt: row.createdAt,
    };
  }
}