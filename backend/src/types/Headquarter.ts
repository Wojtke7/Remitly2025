import Branch from "./Branch"

export default interface Headquarter {
    "address": string | null,
    "bankName": string | null,
    "countryISO2": string,
    "countryName": string,
    "isHeadquarter": boolean,
    "swiftCode": string,
    "branches": [Branch]
}