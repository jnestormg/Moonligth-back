import type { Request, Response } from "express";

export async function getMe(req: Request, res: Response): Promise<void> {
  res.status(200).json({ user: req.user });
}
