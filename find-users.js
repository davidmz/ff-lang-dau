import cld from "cld";
import { appendFile, writeFile } from "fs/promises";
import postgres from "postgres";
import config from "./config.js";

const sql = postgres(config.database);

await writeFile(config.usersFileName, "");

const usersCursor = sql`
    select uid, screen_name, description
    from users
    where type=${"user"}
    order by uid asc`.cursor();

let prevPercent = -1;
let totalUsers = 0;
let foundUsers = 0;
for await (const [user] of usersCursor) {
  const [posts, comments] = await Promise.all([
    sql`select body from posts
    where user_id = ${user.uid}
    order by created_at desc limit 100`,
    sql`select body from comments
    where user_id = ${user.uid}
    order by created_at desc limit 100`,
  ]);

  const stat = await Promise.all(
    [
      user.screen_name,
      user.description,
      ...posts.map((it) => it.body),
      ...comments.map((it) => it.body),
    ].map(async (text) => {
      try {
        const { reliable, textBytes, languages } = await cld.detect(text);
        return reliable ? { textBytes, languages } : null;
      } catch (e) {
        // Failed to identify language
      }
      return null;
    })
  );

  let totalBytes = 0;
  const langStat = {};
  for (const { textBytes, languages } of stat.filter(Boolean)) {
    totalBytes += textBytes;
    for (const lang of languages) {
      langStat[lang.code] =
        (langStat[lang.code] || 0) + textBytes * lang.percent;
    }
  }

  for (const lang of Object.keys(langStat)) {
    langStat[lang] /= totalBytes * 100;
  }

  const percent = (parseInt(user.uid.substring(0, 2), 16) * 100) >> 8;
  totalUsers++;
  if (langStat[config.language.code] >= config.language.threshold) {
    await appendFile(config.usersFileName, user.uid + "\n");
    foundUsers++;
  }
  if (percent !== prevPercent) {
    process.stdout.write(
      `${percent}% processed (${Math.round(
        (foundUsers * 100) / totalUsers
      )}% with '${config.language.code}' lang)\n`
    );
    prevPercent = percent;
  }
}

console.log("All done.");
process.exit(0);
