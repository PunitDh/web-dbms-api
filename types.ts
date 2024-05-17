export type Column = {
  column_name: string;
  data_type: string;
};

export type Table = {
  table_name: string;
};

export type SortOrder = "asc" | "desc";
type ActiveTab = "data" | "schema";

export type QueryParams = {
  active: ActiveTab;
  sort: string;
  order: SortOrder;
  columns?: string | string[];
};
