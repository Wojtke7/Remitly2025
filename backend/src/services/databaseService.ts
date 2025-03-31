import { Branch, PrismaClient, Prisma } from '@prisma/client';
import ExcelRow from '../types/ExcelRow';
import BranchI from '../types/BranchI';
import { ErrorWithStatus } from '../utils/errorWithStatus';

const prisma = new PrismaClient();

export class DatabaseService {
    async upsertCountry(row: ExcelRow) {
        try {
            await prisma.country.upsert({
                where: { iso2: row['COUNTRY ISO2 CODE'] },
                update: {},
                create: {
                    iso2: row['COUNTRY ISO2 CODE'],
                    countryName: row['COUNTRY NAME'],
                    timeZone: row['TIME ZONE'],
                },
            })
        }
        catch (error) {
            throw new ErrorWithStatus(500, "An error occurred while upserting country.");
        };
    }

    async createHeadquarters(row: ExcelRow) {
        try {
            await prisma.headquarters.upsert({
                where: { swiftCode: row['SWIFT CODE'] },
                update: {
                    codeType: row['CODE TYPE'],
                    name: row['NAME'],
                    address: row['ADDRESS'],
                    townName: row['TOWN NAME'],
                    countryIso2: row['COUNTRY ISO2 CODE'],
                },
                create: {
                    swiftCode: row['SWIFT CODE'],
                    codeType: row['CODE TYPE'],
                    name: row['NAME'],
                    address: row['ADDRESS'],
                    townName: row['TOWN NAME'],
                    countryIso2: row['COUNTRY ISO2 CODE'],
                },
            });

        } catch (error) {
            throw new ErrorWithStatus(500, "An error occurred while creating/updating headquarter.");
        }
    }

    async createBranch(row: ExcelRow) {
        const headquarterSwiftCode = row['SWIFT CODE'].slice(0, -3) + 'XXX';
        try {
            const existingHeadquarter = await prisma.headquarters.findUnique({
                where: { swiftCode: headquarterSwiftCode },
                select: { swiftCode: true },
            });
            
            await prisma.branch.upsert({
                where: { swiftCode: row['SWIFT CODE'] },
                update: {
                    name: row['NAME'],
                    codeType: row['CODE TYPE'],
                    address: row['ADDRESS'],
                    townName: row['TOWN NAME'],
                    countryIso2: row['COUNTRY ISO2 CODE'],
                    headquarterSwiftCode: existingHeadquarter ? headquarterSwiftCode : null,
                },
                create: {
                    swiftCode: row['SWIFT CODE'],
                    name: row['NAME'],
                    codeType: row['CODE TYPE'],
                    address: row['ADDRESS'],
                    townName: row['TOWN NAME'],
                    countryIso2: row['COUNTRY ISO2 CODE'],
                    headquarterSwiftCode: existingHeadquarter ? headquarterSwiftCode : null,
                },
            });
        } catch (error) {
            throw new ErrorWithStatus(500, "An error occurred while creating/updating branch.");
        }
    }
    

    async getHeadquarterBySwiftCode(swiftCode: string) {
        try {
            const headquarter = await prisma.headquarters.findUnique({
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

            return headquarter
        } catch (error) {
            throw new ErrorWithStatus(500, 'Error retrieving headquarter by swiftCode')
        }
    }

    async getBranchBySwiftCode(swiftCode: string) {
        try {
            const branch = await prisma.branch.findUnique({
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
            
            return branch
        }
        catch (error) {
            throw new ErrorWithStatus(500, 'Error retrieving branch by swiftCode')
        }
    }

    async getSwiftCodesByCountry(countryISO2: string) {
        try {
            const country = await prisma.country.findUnique({
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

            if (!country) {
                throw new ErrorWithStatus(404, `Country with iso2 "${countryISO2}" not found.`);
            }

            return country;
        } catch (error) {
            if (error instanceof ErrorWithStatus) {
                throw error;
            } 
            else {            
                throw new ErrorWithStatus(500, 'Error retrieving swift codes by country')
            }
        }
    }

    async addHeadquarter(data: BranchI) {
        try {
            if (data.swiftCode.length < 8 || data.swiftCode.length > 11) {
                throw new ErrorWithStatus(400, "swiftCode must be between 8 and 11 characters.");
            }
    
            const swiftPrefix = data.swiftCode.substring(0, 8);
    
            await prisma.$transaction(async (tx) => {
                await tx.country.upsert({
                    where: { iso2: data.countryISO2 },
                    update: {},
                    create: { iso2: data.countryISO2, countryName: data.countryName }
                });
    
                const headquarter = await tx.headquarters.create({
                    data: {
                        swiftCode: data.swiftCode,
                        codeType: "BIC11",
                        name: data.bankName,
                        address: data.address,
                        countryIso2: data.countryISO2
                    }
                });
    
                await tx.branch.updateMany({
                    where: {
                        swiftCode: { startsWith: swiftPrefix },
                        headquarterSwiftCode: null
                    },
                    data: { headquarterSwiftCode: headquarter.swiftCode }
                });
            });
            return { message: "Bank headquarter created successfully." };

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                switch (error.code) {
                    case "P2002":
                        throw new ErrorWithStatus(400, `Headquarter with swiftCode "${data.swiftCode}" already exists.`);
                    case "P2025":
                        throw new ErrorWithStatus(404, "Related record not found.");
                    case "P2000":
                        throw new ErrorWithStatus(400, "One or more fields provided are too long. Please check field lengths.");
                    default:
                        throw new ErrorWithStatus(500, `Database error occurred: ${error.message}`);
                }
            } else if (error instanceof ErrorWithStatus) {
                throw error; 
            }
            else if (error instanceof Error) {
                throw new ErrorWithStatus(500, `Unexpected error occurred: ${error.message}`);
            } else {
                throw new ErrorWithStatus(500, "An unexpected error occurred.");
            }
        }
    }


    async addBranch(data: BranchI) {
        try {
            if (data.swiftCode.length < 8 || data.swiftCode.length > 11) {
                throw new Error("swiftCode must be between 8 and 11 characters.");
            }
            await prisma.$transaction(async (tx) => {
                await tx.country.upsert({
                    where: { iso2: data.countryISO2 },
                    update: {},
                    create: { iso2: data.countryISO2, countryName: data.countryName }
                });

                const headquarter = await tx.headquarters.findUnique({
                    where: {
                        swiftCode: data.swiftCode.slice(0, -3) + 'XXX',
                    }
                });

                const headquarterSwiftCode = headquarter ? headquarter.swiftCode : null;

                await tx.branch.create({
                    data: {
                        swiftCode: data.swiftCode,
                        codeType: "BIC11",
                        name: data.bankName,
                        address: data.address,
                        countryIso2: data.countryISO2,
                        headquarterSwiftCode: headquarterSwiftCode
                    }
                });
            });
            
            return { message: "Bank branch created successfully." };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                switch (error.code) {
                    case "P2002":
                        throw new ErrorWithStatus(400, `Branch with swiftCode "${data.swiftCode}" already exists.`);
                    case "P2025":
                        throw new ErrorWithStatus(404, "Related record not found.");
                    case "P2000":
                        throw new ErrorWithStatus(400, "One or more fields provided are too long. Please check field lengths.");
                    default:
                        throw new ErrorWithStatus(500, `Database error occurred: ${error.message}`);
                }
            } else if (error instanceof Error) {
                throw new ErrorWithStatus(500, `Unexpected error occurred: ${error.message}`);
            } else {
                throw new ErrorWithStatus(500, "An unexpected error occurred.");
            }
        }
    }

    async deleteBank(swiftCode: string): Promise<{message: string}> {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const headquarter = await tx.headquarters.findUnique({
                    where: { swiftCode },
                });
    
                if (headquarter) {
                    await tx.headquarters.delete({
                        where: { swiftCode },
                    });
                    return { message: `Headquarter with swiftCode ${swiftCode} has been deleted.` };
                }
    
                const branch = await tx.branch.findUnique({
                    where: { swiftCode },
                });
    
                if (branch) {
                    await tx.branch.delete({
                        where: { swiftCode },
                    });
                    return { message: `Branch with swiftCode ${swiftCode} has been deleted.` };
                }
    
                throw new ErrorWithStatus(404, `No record found with swiftCode ${swiftCode}`);
            });

            return result;
        } catch (error) {
            if (error instanceof ErrorWithStatus) {
                throw error;
            } else {
                throw new ErrorWithStatus(500, 'An error occurred while deleting the swiftCode');
            }
        }
    }
}