import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import ExcelRow from '../types/ExcelRow';

const prisma = new PrismaClient();

async function upsertCountry(row: ExcelRow) {
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
  
  async function createHeadquarters(row: ExcelRow) {
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
  
  async function createBranch(row: ExcelRow) {
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
  
  
    function parseXLSX(): ExcelRow[] {
        const workbook = XLSX.readFile('../../static/swift.xlsx');
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        defval: "",
        });
        
        const sortedData = jsonData.sort((a, b) => {
            const aEndsWithXXX = a['SWIFT CODE'].endsWith("XXX") ? 0 : 1;
            const bEndsWithXXX = b['SWIFT CODE'].endsWith("XXX") ? 0 : 1;
            return aEndsWithXXX - bEndsWithXXX;
        });
        
        return sortedData;
    }

    async function insertDataIntoDB(sortedData: ExcelRow[]): Promise<void> {
        for (const row of sortedData) {
            try {
                await upsertCountry(row);
                    if (row['SWIFT CODE'].endsWith('XXX')) {
                    await createHeadquarters(row);
                } else {
                    await createBranch(row);
                }
            } catch (error) {
                if ((error as any).code === 'P2003') {
                        console.log(row["SWIFT CODE"])
                }
                console.error('Error inserting data:', error);
            }
        }
    }

  const data = parseXLSX()
  insertDataIntoDB(data);