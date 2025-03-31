import request from 'supertest';
import { app } from "../../app";

import dotenv from "dotenv";
import BranchI from '../../types/BranchI';
dotenv.config();

const mockInsertDataIntoDB = jest.fn();
const mockGetSwiftCode = jest.fn();
const mockGetSwiftCodesByCountry = jest.fn();

jest.doMock('../../services/swiftService', () => {
  return {
    SwiftService: jest.fn().mockImplementation(() => ({
      insertDataIntoDB: mockInsertDataIntoDB,
      getSwiftCode: mockGetSwiftCode,
      getSwiftCodesByCountry: mockGetSwiftCodesByCountry,
    })),
  };
});

describe('POST /parse', () => {
  it('should return 400 if filePath is missing', async () => {
    const response = await request(app).post('/v1/swift-codes/parse').query({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('filePath parameter is required in the query');
  });

describe('GET /:swiftCode', () => {
  it('should return 400 for invalid swiftCode', async () => {
    const response = await request(app).get('/v1/swift-codes/3029302930923092');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid SWIFT code. Please provide a valid 8 or 11 character SWIFT code.');
  });

  it('should return 200 and swift code details for headquarter', async () => {
    const response = await request(app).get('/v1/swift-codes/SECTCLR1XXX');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('address');
    expect(response.body).toHaveProperty('bankName');
    expect(response.body).toHaveProperty('countryISO2');
    expect(response.body).toHaveProperty('countryName');
    expect(response.body).toHaveProperty('isHeadquarter');
    expect(response.body).toHaveProperty('swiftCode');
    expect(response.body).toHaveProperty('branches');

    expect(response.body.branches).toBeInstanceOf(Array);
    response.body.branches.forEach((branch: BranchI) => {
      expect(branch).toHaveProperty('address');
      expect(branch).toHaveProperty('bankName');
      expect(branch).toHaveProperty('countryISO2');
      expect(branch).toHaveProperty('countryName');
      expect(branch).toHaveProperty('isHeadquarter');
      expect(branch).toHaveProperty('swiftCode');
    });

  });

  it('should return 200 and swift code details for branch', async () => {
    const response = await request(app).get('/v1/swift-codes/SECTCLR1850');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('address');
    expect(response.body).toHaveProperty('bankName');
    expect(response.body).toHaveProperty('countryISO2');
    expect(response.body).toHaveProperty('countryName');
    expect(response.body).toHaveProperty('isHeadquarter');
    expect(response.body).toHaveProperty('swiftCode');
  });


describe('GET /getSwiftCodesByCountry', () => {
  it('should return 400 for invalid ISO2 code', async () => {
    const response = await request(app).get('/v1/swift-codes/country/US1');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid country ISO2 code. Please provide a valid 2-character ISO2 country code.');
  });

  it('should return 200 with list of swift codes for a country', async () => {

    const response = await request(app).get('/v1/swift-codes/country/PL');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('countryISO2');
    expect(response.body).toHaveProperty('countryName');
    expect(response.body).toHaveProperty('swiftCodes');
    
    expect(response.body.swiftCodes).toBeInstanceOf(Array);
    
    response.body.swiftCodes.forEach((swiftCode: any) => {
      expect(swiftCode).toHaveProperty('address');
      expect(swiftCode).toHaveProperty('bankName');
      expect(swiftCode).toHaveProperty('countryISO2');
      expect(swiftCode).toHaveProperty('isHeadquarter');
      expect(swiftCode).toHaveProperty('swiftCode');
    });
  });
  })
})
})