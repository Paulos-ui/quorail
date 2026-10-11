import {config} from "dotenv";
config({path:".env.local"}); config();
import postgres from "postgres";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
if(!process.env.DATABASE_URL)throw new Error("Set DATABASE_URL in .env.local or environment");
const sql=postgres(process.env.DATABASE_URL,{max:1});
try {
 await sql.unsafe(readFileSync(resolve("scripts/schema.sql"),"utf8"));
 console.log("Quorail tables initialized. No sample/demo transactions inserted.");
}finally{await sql.end();}
