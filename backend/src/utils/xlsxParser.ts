import * as XLSX from 'xlsx';
import ExcelRow from '../types/ExcelRow';

export class XLSXParser {
    parseXLSX(filePath: string): ExcelRow[] {

        const workbook = XLSX.readFile(filePath);
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
}
