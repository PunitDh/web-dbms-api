import { NextFunction, Request, Response } from "express";
import { validateTableName } from "../src/utils";

export default function validateTable() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tablename = req.params.tablename;
    if (!(await validateTableName(tablename))) {
      res.status(400).send("Invalid table name.");
      return;
    }
    next();
  };
}
