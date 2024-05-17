import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import path from "path";
import bodyParser from "body-parser";
import { UnknownEnvVariableError } from "./src/errors";
import {
  checkQuery,
  constructSearchParams,
  constructSelectQuery,
  getColumnDetails,
  Query,
} from "./src/utils";
import { pool } from "./db";
import validateTable from "./middleware/validateTable";
import { QueryParams, Table } from "./types";
import { cached } from "./middleware/cached";

const app = express();

if (!process.env.PORT) throw new UnknownEnvVariableError();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cached());

app.get("/", async (req: Request, res: Response) => {
  const result = await pool.query<Table>(Query.GET_TABLES);
  res.send({ tables: result.rows });
});

app.get("/:tablename", validateTable(), async (req: Request, res: Response) => {
  const { tablename } = req.params;
  const queryParams = req.query as QueryParams;

  const {
    active = "data",
    sort: sortColumn,
    order = "asc",
    columns: selectedColumns,
  } = req.query as QueryParams;

  const { rows: columns } = await getColumnDetails(tablename);
  const columnNames = columns.map((column) => column.column_name);

  const query = constructSelectQuery(
    tablename,
    columnNames,
    sortColumn,
    order,
    selectedColumns
  );

  const { rows } = await pool.query(query);

  const searchParams = constructSearchParams(queryParams);

  res.send({
    tablename,
    rows,
    columns: selectedColumns
      ? columns.filter((it) => selectedColumns.includes(it.column_name))
      : columns,
    allColumns: columns,
    active: active || "data",
    sort: sortColumn,
    order,
  });
});

app.post(
  "/:tablename",
  validateTable(),
  async (req: Request, res: Response) => {
    const { tablename } = req.params;

    const queryParams = req.query as QueryParams;

    const { selectedColumns: columns } = req.body as {
      selectedColumns: string | string[];
    };

    const searchParams = constructSearchParams({
      ...queryParams,
      columns,
    });

    res.send(`/${tablename}?${searchParams.toString()}`);
  }
);

app.post("/", async (req: Request, res: Response) => {
  const { query } = req.body as { query: string };

  console.log("Here");

  if (checkQuery(query)) {
    console.error("Drop or Delete cannot be used in query");
    res.status(400).send("Drop or Delete cannot be used in query");
    return;
  }

  try {
    const result = await pool.query(query);

    res.send({ query, rows: result.rows, fields: result.fields });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.listen(port, () => console.log("Server listening on port", port));
