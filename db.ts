import { Pool } from "pg";
import { UnknownEnvVariableError } from "./src/errors";

if (!process.env.DATABASE_URL) throw new UnknownEnvVariableError();
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});