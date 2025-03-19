import { PrismaClient } from '@prisma/client';
import ExcelRow from '../types/ExcelRow';

const prisma = new PrismaClient();

export class DatabaseService {
    async upsertCountry(row: ExcelRow) {
        await prisma.country.upsert({
            where: { iso2: row['COUNTRY ISO2 CODE'] },
            update: {},
            create: {
                iso2: row['COUNTRY ISO2 CODE'],
                countryName: row['COUNTRY NAME'],
                timeZone: row['TIME ZONE'],
            },
        });
    }

    async createHeadquarters(row: ExcelRow) {
        await prisma.headquarters.create({
            data: {
                swiftCode: row['SWIFT CODE'],
                codeType: row['CODE TYPE'],
                name: row['NAME'],
                address: row['ADDRESS'],
                townName: row['TOWN NAME'],
                countryIso2: row['COUNTRY ISO2 CODE'],
            },
        });
    }

    async createBranch(row: ExcelRow) {
        let headquarterSwiftCode = row['SWIFT CODE'].slice(0, -3) + 'XXX';

        try {
            await prisma.branch.create({
                data: {
                    swiftCode: row['SWIFT CODE'],
                    name: row['NAME'],
                    codeType: row['CODE TYPE'],
                    address: row['ADDRESS'],
                    townName: row['TOWN NAME'],
                    countryIso2: row['COUNTRY ISO2 CODE'],
                    headquarterSwiftCode: headquarterSwiftCode,
                },
            });
        } catch (error) {
            if ((error as any).code === 'P2003') {
                await prisma.branch.create({
                    data: {
                        swiftCode: row['SWIFT CODE'],
                        name: row['NAME'],
                        codeType: row['CODE TYPE'],
                        address: row['ADDRESS'],
                        townName: row['TOWN NAME'],
                        countryIso2: row['COUNTRY ISO2 CODE'],
                        headquarterSwiftCode: null,
                    },
                });
            } else {
                console.error('Error inserting branch:', error);
            }
        }
    }

    async getHeadquarterBySwiftCode(swiftCode: string) {
        return await prisma.headquarters.findUnique({
            where: { swiftCode },
            include: {
                country: true,
                branches: {
                    include: {
                        country: true,
                    },
                },
            },
        });
    }

    async getBranchBySwiftCode(swiftCode: string) {
        return await prisma.branch.findUnique({
            where: { swiftCode },
            include: {
                country: true,
                headquarter: {
                    include: {
                        country: true,
                    },
                },
            },
        });
    }

    async getSwiftCodesByCountry(countryISO2: string) {
        return await prisma.country.findUnique({
            where: { iso2: countryISO2 },
            include: {
                headquarters: {
                    include: {
                        country: true,
                    },
                },
                branches: {
                    include: {
                        country: true,
                    },
                },
            },
        });
    }
}
