import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import swiftRouter from "./routes/swiftRoutes";
import cors from "cors";

dotenv.config();

const app: Express = express();

export { app }

app.use(express.json());
app.use(cors()); 

app.use("/v1/swift-codes", swiftRouter);

if (require.main === module) {
  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}