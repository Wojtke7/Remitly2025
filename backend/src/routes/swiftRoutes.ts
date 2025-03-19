import { Router } from "express";
import { parseDataIntoDB, getSwiftCode, getSwiftCodesByCountry } from "../controllers/swiftController";

const router = Router();

router.post("/parse", parseDataIntoDB);

router.get("/:swiftCode", getSwiftCode);

router.get("/country/:CountryISO2", getSwiftCodesByCountry)

export default router;