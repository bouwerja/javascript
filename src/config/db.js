const isDevOrTest = ['development', 'test'].includes(process.env.NODE_ENV || 'development');

class InMemoryAdapter {
  constructor() {
    this.tables = {
      users: [
        { id: 1, name: 'Dev User', email: 'dev@example.com', role: 'admin' }
      ]
    };
  }

  async select(table, filterFn = null) {
    const data = this.tables[table] || [];
    return filterFn ? data.filter(filterFn) : [...data];
  }

  async insert(table, record) {
    if (!this.tables[table]) this.tables[table] = [];
    const newRecord = { id: Date.now(), ...record };
    this.tables[table].push(newRecord);
    return newRecord;
  }

  async clear(table) {
    this.tables[table] = [];
  }
}

class LiveDatabaseAdapter {
  async select(table, filterFn) {
    throw new Error('Live database connection not configured yet');
  }

  async insert(table, record) {
    throw new Error('Live database connection not configured yet');
  }
}

export const db = isDevOrTest ? new InMemoryAdapter() : new LiveDatabaseAdapter();