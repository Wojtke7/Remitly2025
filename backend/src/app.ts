import express, { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", async (req: Request, res: Response) => {
    const userCount = await prisma.country.findMany();
    res.json(
      userCount
    );});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});