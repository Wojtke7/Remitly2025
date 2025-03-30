import { Router } from "express";
import { parseDataIntoDB, getSwiftCode, getSwiftCodesByCountry, addSwiftCode, deleteSwiftCode } from "../controllers/swiftController";

const router = Router();

router.post("/parse", parseDataIntoDB);

router.get("/:swiftCode", getSwiftCode);

router.get("/country/:CountryISO2", getSwiftCodesByCountry)

router.post("/", addSwiftCode)

router.delete("/:swiftCode", deleteSwiftCode)

export default router;