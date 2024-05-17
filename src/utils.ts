import fs from "fs";
import { QueryResult } from "pg";
import { pool } from "../db";
import { Column, QueryParams, SortOrder, Table } from "../types";

export const Query = {
  GET_TABLES: fs.readFileSync("./src/sql/get-tables.sql", "utf-8"),
  GET_COLUMNS: fs.readFileSync("./src/sql/get-columns.sql", "utf-8"),
} as const;

export const checkQuery = (query: string): boolean => {
  const cleanedQueries = query
    .split(";")
    .map((each) => each.trim().toLowerCase());

  const forbiddenKeywords = ["drop", "delete"];

  return forbiddenKeywords.some((word) =>
    cleanedQueries.some((query) => query.startsWith(word))
  );
};

export async function validateTableName(tablename: string): Promise<boolean> {
  const validTables = await pool.query<Table>(Query.GET_TABLES);
  return validTables.rows.map((row) => row.table_name).includes(tablename);
}

export async function getColumnDetails(
  tablename: string
): Promise<QueryResult<Column>> {
  return await pool.query<Column>(Query.GET_COLUMNS, [tablename]);
}

export function constructSelectQuery(
  tablename: string,
  columnNames: string[],
  sortColumn: string,
  order: SortOrder,
  selectedColumns?: string | string[]
) {
  const columnList = getColumnList(selectedColumns);
  const validOrder = getValidSortOrder(order);
  const orderByColumn = getValidSortColumn(columnNames, sortColumn);
  return `SELECT ${columnList} FROM public."${tablename}" ORDER BY "${orderByColumn}" ${validOrder}`;
}

export function constructSearchParams(params: QueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    Array.isArray(value)
      ? value.forEach((item) => searchParams.append(key, item))
      : searchParams.append(key, value);
  });
  return searchParams;
}

function getColumnList(selectedColumns?: string | string[]) {
  return selectedColumns
    ? Array.isArray(selectedColumns)
      ? selectedColumns.map((col) => `"${col}"`).join(", ")
      : `"${selectedColumns}"`
    : "*";
}

function getValidSortColumn(columnNames: string[], sortColumn: string): string {
  return columnNames.includes(sortColumn) ? sortColumn : columnNames[0];
}

function getValidSortOrder(order: SortOrder): SortOrder {
  return ["asc", "desc"].includes(order) ? order : "asc";
}
