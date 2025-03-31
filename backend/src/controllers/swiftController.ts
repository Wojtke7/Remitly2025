import { Handler, Request, RequestHandler, Response } from 'express';
import { SwiftService } from '../services/swiftService';
import { ErrorWithStatus } from '../utils/errorWithStatus';
import { Branch } from '@prisma/client';
import BranchI from '../types/BranchI'

const swiftService = new SwiftService();

const parseDataIntoDB: RequestHandler = async (req: Request, res: Response) => {
    try {
        const filePath = req.query.filePath as string;

        if (!filePath) {
            res.status(400).json({ message: "filePath parameter is required in the query" });
            return
        }

        await swiftService.insertDataIntoDB(filePath);
        res.status(200).json({ message: "Data inserted successfully" });

    } catch (err) {
        if (err instanceof ErrorWithStatus) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        res.status(500).json({
            message: "Error inserting data into database. Check your file path.",
            error: err instanceof Error ? err.message : String(err)
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

        res.status(200).json(response);
    } catch (err) {
        if (err instanceof ErrorWithStatus) {
            res.status(err.status).json({ message: err.message });
            return;
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
        res.status(200).json(response)
    } catch (err) {
        if (err instanceof ErrorWithStatus) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: "An unexpected error occurred" })
    }
}



const addSwiftCode: RequestHandler = async (req: Request, res: Response) => {
    const data = req.body
    try {
        const response = await swiftService.addSwift(data)
        res.status(201).json(response)
    } catch (err) {
        if (err instanceof ErrorWithStatus) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: "An unexpected error occurred" });
    }
}

const deleteSwiftCode: RequestHandler = async (req: Request, res: Response) => {
    const swiftCode = req.params.swiftCode
    try {
        const response = await swiftService.deleteSwift(swiftCode)
        res.status(200).json(response)
    } catch(err) {
        if (err instanceof ErrorWithStatus) {
            res.status(err.status).json({ message: err.message });
            return;
        }
        res.status(500).json({ message: "An unexpected error occurred" });
    }
}

export {
    parseDataIntoDB,
    getSwiftCode,
    getSwiftCodesByCountry,
    addSwiftCode,
    deleteSwiftCode
}
