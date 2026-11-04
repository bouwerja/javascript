import db from "../config/db.js";

export class DiscordModel {
    constructor({ id, createdAt = new Date().now() }) {
        this.id = id;
        this.createdAt = createdAt;
    }

    toJSON() {
        return {
            id: this.id,
            message: this.message,
        };
    }

}

class DiscrodMessage extends DiscordModel {
    constructor(id) {
        super(id);
    }
}