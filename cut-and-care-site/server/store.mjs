// Stockage des réservations dans un fichier JSON (écritures sérialisées + renommage atomique).
// Suffisant pour un salon ; pour plusieurs instances, passer sur une base (SQLite/Postgres).
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import {rename, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

export class Store {
  constructor(file) {
    this.file = file;
    this.queue = Promise.resolve();
    mkdirSync(dirname(file), {recursive: true});
    this.data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {bookings: []};
  }

  all() {
    return this.data.bookings;
  }

  get(id) {
    return this.data.bookings.find((b) => b.id === id) ?? null;
  }

  find(predicate) {
    return this.data.bookings.find(predicate) ?? null;
  }

  async create(booking) {
    this.data.bookings.push(booking);
    await this.flush();
    return booking;
  }

  async update(id, patch) {
    const b = this.get(id);
    if (!b) return null;
    Object.assign(b, patch, {updatedAt: new Date().toISOString()});
    await this.flush();
    return b;
  }

  flush() {
    const snapshot = JSON.stringify(this.data, null, 1);
    this.queue = this.queue.then(async () => {
      const tmp = `${this.file}.tmp`;
      await writeFile(tmp, snapshot);
      await rename(tmp, this.file);
    });
    return this.queue;
  }
}
