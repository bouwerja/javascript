import db from "../config/db.js";

export class DiscordModel {
    constructor({ id, message}) {
        this.id = id;
        this.message = message;
    }

    toJSON() {
        return {
            id: this.id,
            message: this.message,
        };
    }

    static async getMessage(id) {
        const records = await db.select("message");
    }
}