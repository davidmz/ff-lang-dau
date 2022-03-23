import { createReadStream } from "fs";
import { appendFile, writeFile } from "fs/promises";
import postgres from "postgres";
import { createInterface } from "readline";
import config from "./config.js";

const sql = postgres(config.database);

const fileStream = createReadStream(config.usersFileName);
const users = createInterface({ input: fileStream });

const dauMap = new Map();

let prevPercent = -1;
for await (const userId of users) {
  const stat = await sql`
    select to_char(created_at, 'YYYY-MM-DD') as date from posts where user_id = ${userId} group by date
    union select to_char(created_at, 'YYYY-MM-DD') as date from comments where user_id = ${userId} group by date
    union select to_char(created_at, 'YYYY-MM-DD') as date from likes where user_id = ${userId} group by date`;
  for (const { date } of stat) {
    dauMap.set(date, 1 + (dauMap.get(date) || 0));
  }

  const percent = (parseInt(userId.substring(0, 2), 16) * 100) >> 8;
  if (percent !== prevPercent) {
    process.stdout.write(`${percent}% processed\n`);
    prevPercent = percent;
  }
}

console.log(`Writing results to ${config.dauFileName}...`);

await writeFile(config.dauFileName, "");
let day = new Date(config.dauFrom);
const now = new Date();
while (day <= now) {
  const sDay = day.toISOString().substring(0, 10);
  await appendFile(config.dauFileName, `${sDay},${dauMap.get(sDay) || 0}\n`);
  day.setDate(day.getDate() + 1);
}

console.log("All done.");
process.exit(0);
