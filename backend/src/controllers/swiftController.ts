import { Handler, Request, RequestHandler, Response } from 'express';
import { SwiftService } from '../services/swiftService';

const swiftService = new SwiftService();

const parseDataIntoDB: RequestHandler = async (req: Request, res: Response) => {
    try {
        const filePath = req.query.filePath as string;

        if (!filePath) {
            res.status(400).json({ message: "filePath parameter is required in the query" });
            return
        }
        
        if (typeof filePath !== 'string') {
            res.status(400).json({ message: "filePath parameter must be a single string" });
            return
        }

        await swiftService.insertDataIntoDB(filePath);
        res.status(200).json({ message: "Data inserted successfully" });

    } catch (error) {
        res.status(500).json({
            message: "Error inserting data into database. Check your file path.",
            error: error instanceof Error ? error.message : String(error)
        });
    }

};

const getSwiftCode: RequestHandler = async (req: Request, res: Response) => {
    try {
        const swiftCode = req.params.swiftCode;

        if (!swiftCode || swiftCode.length < 8 || swiftCode.length > 11) {
            res.status(400).json({
                message: "Invalid SWIFT code. Please provide a valid 8 or 11 character SWIFT code."
            });
            return
        }

        const response = await swiftService.getSwiftCode(swiftCode);
        
        if (!response) {
            res.status(404).json({ message: `SWIFT code ${swiftCode} not found.` });
            return
        }

        res.status(200).json(response);
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
            return
        }
        res.status(500).json({ message: "An unexpected error occurred" });
    }
};

const getSwiftCodesByCountry: RequestHandler = async (req: Request, res: Response) => {
    try {
        const ISO2Code = req.params.CountryISO2;
        
        if (!ISO2Code || ISO2Code.length !== 2) {
            res.status(400).json({
                message: "Invalid country ISO2 code. Please provide a valid 2-character ISO2 country code."
            });
            return
        }

        const response = await swiftService.getSwiftCodesByCountry(ISO2Code);
        
        if (!response) {
            res.status(404).json({
                message: `No SWIFT codes found for country with ISO2 code: ${ISO2Code}.`
            });
            return
        }

        res.status(200).json(response)
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
            return
        }
        res.status(500).json({ message: "An unexpected error occurred" })
    }
}

export {
    parseDataIntoDB,
    getSwiftCode,
    getSwiftCodesByCountry
}
