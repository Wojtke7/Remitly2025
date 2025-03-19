export default interface CountryResponse {
    "countryISO2": string,
    "countryName": string,
    "swiftCodes": {
        "address": string | null,
        "bankName": string | null,
        "countryISO2": string,
        "isHeadquarter": boolean,
        "swiftCode": string
    }[]
}