import express, { Express, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import swiftRouter from "./routes/swiftRoutes";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); 

app.use("/v1/swift-codes", swiftRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});