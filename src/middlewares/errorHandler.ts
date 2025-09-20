import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _: Request,
  res: Response,
  __: NextFunction
) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};
