import Sqlite from "sqlite3";
import fs from "fs";
export default class Database {
  private db: Sqlite.Database;
  constructor(private path: string) {
    this.db = new Sqlite.Database(path);
  }
  public initDatabase = async (): Promise<void> =>
    new Promise((resolve, reject) => {
      this.db.serialize(() => {
        const query: string[] = fs
          .readFileSync("./init.sql")
          .toString()
          .split("\n");
        let success: number = 0;
        query.forEach((singleQuery) =>
          this.db.run(singleQuery, function (error) {
            console.debug(`executed "${singleQuery}"`);
            if (error) {
              console.error(`Error: ${error.message}`);
              reject(error);
              return;
            }

            success += 1;
            if (success === query.length) {
              console.debug("database initialized...");
              resolve();
            }
          })
        );
      });
    });

  public run = async (
    query: string,
    params: (string | number)[]
  ): Promise<number> =>
    new Promise((resolve, reject) => {
      this.db.run(query, params, function (error) {
        if (error) {
          reject(error);
          return;
        }
        resolve(this.lastID);
      });
    });

  public select = async (
    query: string,
    params: (string | number)[]
  ): Promise<object[]> =>
    new Promise((resolve, reject) => {
      this.db.all(
        query,
        params,
        function (error: Error | null, results: any[]) {
          if (error) {
            reject(error);
            return;
          }
          resolve(results);
        }
      );
    });
}
