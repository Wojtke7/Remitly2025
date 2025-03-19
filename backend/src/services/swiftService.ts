import { DatabaseService } from './databaseService';
import { XLSXParser } from '../utils/xlsxParser';
import Headquarter from '../types/Headquarter';
import Branch from '../types/Branch';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import CountryResponse from '../types/CountryResponse';

const prisma = new PrismaClient();
export class SwiftService {
    private databaseService: DatabaseService;
    private xlsxParser: XLSXParser;

    constructor() {
        this.databaseService = new DatabaseService();
        this.xlsxParser = new XLSXParser();
    }

    async insertDataIntoDB(filePath: string): Promise<void> {
        try {
            const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
            await fs.access(absolutePath);

            const sortedData = this.xlsxParser.parseXLSX(absolutePath);

            const operations = sortedData.map(async (row) => {
                try {
                    await this.databaseService.upsertCountry(row);
                    if (row['SWIFT CODE'].endsWith('XXX')) {
                        return await this.databaseService.createHeadquarters(row);
                    } else {
                        return await this.databaseService.createBranch(row);
                    }
                } catch (error) {
                    console.error(`Error processing row ${JSON.stringify(row)}:`, error);
                }
            });

            await Promise.allSettled(operations);

        } catch (error) {
            throw new Error('File not found or database error.');
        }
    }
    
    async getSwiftCode(swiftCode: string): Promise<Headquarter | Branch | null> {
        try {
            const headquarter = await this.databaseService.getHeadquarterBySwiftCode(swiftCode);

            if (headquarter) {
                const response = {
                    address: headquarter.address,
                    bankName: headquarter.name,
                    countryISO2: headquarter.countryIso2,
                    countryName: headquarter.country.countryName,
                    isHeadquarter: true,
                    swiftCode: headquarter.swiftCode,
                    branches: headquarter.branches.map(branch => ({
                        address: branch.address,
                        bankName: branch.name,
                        countryISO2: branch.countryIso2,
                        countryName: branch.country.countryName,
                        isHeadquarter: false,
                        swiftCode: branch.swiftCode,
                    })),
                };
                return response;
            }

            const branch = await this.databaseService.getBranchBySwiftCode(swiftCode);

            if (branch) {
                return {
                    address: branch.address,
                    bankName: branch.name,
                    countryISO2: branch.countryIso2,
                    countryName: branch.country.countryName,
                    isHeadquarter: false,
                    swiftCode: branch.swiftCode,
                };
            }

            return null
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message); 
            } else {
                throw new Error("An unexpected error occurred");
            }
        }
    }

    async getSwiftCodesByCountry(countryISO2: string): Promise<CountryResponse | null> {
        try {
            const country = await this.databaseService.getSwiftCodesByCountry(countryISO2);

            if (!country) {
                return null
            }

            const response = {
                countryISO2: country.iso2,
                countryName: country.countryName,
                swiftCodes: [
                    ...country.headquarters.map(headquarter => ({
                        address: headquarter.address,
                        bankName: headquarter.name,
                        countryISO2: headquarter.countryIso2,
                        isHeadquarter: true,
                        swiftCode: headquarter.swiftCode,
                    })),
                    ...country.branches.map(branch => ({
                        address: branch.address,
                        bankName: branch.name,
                        countryISO2: branch.countryIso2,
                        isHeadquarter: false,
                        swiftCode: branch.swiftCode,
                    })),
                ],
            };

            return response;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message); 
            } else {
                throw new Error("An unexpected error occurred");
            }
        }
    }
}
