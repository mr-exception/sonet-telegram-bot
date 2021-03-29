import Sqlite from "sqlite3";
import fs from "fs";
// initializing database
const db = new Sqlite.Database("./data.sqlite");
db.serialize(() => {
  const query: string[] = fs.readFileSync("./init.sql").toString().split("\n");
  query.forEach((singleQuery) => db.run(singleQuery));
  console.debug("database initialized...");
});
export default db;
