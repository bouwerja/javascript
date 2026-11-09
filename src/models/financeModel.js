import { db } from "../config/db.js";
import { BaseModel } from "./baseModel.js";

export class FinanceModel extends BaseModel {
    constructor({ id, createdAt }) {
        super({ id, createdAt });
    }
}