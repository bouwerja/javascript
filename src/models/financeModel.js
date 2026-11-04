import { db } from "../config/db.js";

export class FinanceModel {
    constructor({ id }) {
        this.id = id;
    }

    toJSON() {
        return {
            id: this.id,
        };
    }
}