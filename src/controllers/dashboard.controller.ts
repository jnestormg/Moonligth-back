import type { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";

export async function getDashboardResumen(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await dashboardService.getDashboardResumen());
}
