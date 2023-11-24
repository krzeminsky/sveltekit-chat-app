import fs from "fs";

fs.unlinkSync("../database.db");
fs.writeFileSync("../database.db", "");

console.log('reset complete');