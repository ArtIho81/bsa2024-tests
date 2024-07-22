import { readFileSync } from "fs";
import * as idGenerator from "uuid";
import CartParser from "./CartParser";

jest.mock("fs");
jest.mock("uuid");

let parser;
const mockId = "3e6def17-5e87-4f27-b6b8-ae78948523a9";

const validContent = `Product name,Price,Quantity
Mollis consequat,9,3
Tvoluptatem,10.32,2`;

beforeEach(() => {
  parser = new CartParser();
  idGenerator.v4.mockReturnValue(mockId);
});

describe("CartParser - unit tests", () => {
  // Add your unit tests here.

  it("should return an empty array if validation is successful", () => {
    const result = parser.validate(validContent);
    expect(result).toEqual([]);
  });

  it("should return an error information object", () => {
    const type = "Error type";
    const message = "Error message";
    const returnedError = {
      type,
      row: 1,
      column: 0,
      message,
    };
    const result = parser.createError(type, 1, 0, message);
    expect(result).toEqual(returnedError);
  });

  it("should return an one element array for header validation error", () => {
    const notValidHeader = validContent.replace("name", "");
    const result = parser.validate(notValidHeader);
    expect(result).toEqual([
      {
        type: "header",
        row: 0,
        column: 0,
        message:
          'Expected header to be named "Product name" but received Product.',
      },
    ]);
  });

  it("should return an one element array for cells number validation error", () => {
    const notValidLine = validContent.replace(",9", "");
    const result = parser.validate(notValidLine);
    expect(result).toEqual([
      {
        type: "row",
        row: 1,
        column: -1,
        message: "Expected row to have 3 cells but received 2.",
      },
    ]);
  });

//   This case passed when line 113 (.filter(Boolean)) is commented
  it("should return an one element array for empty cell error", () => {
    const notValidLine = validContent.replace("Mollis consequat", "");
    const result = parser.validate(notValidLine);
    expect(result).toEqual([
      {
        type: "cell",
        row: 1,
        column: 0,
        message: `Expected cell to be a nonempty string but received "".`,
      },
    ]);
  });

  it("should return an one element array for number cell error", () => {
    const notValidCell = validContent.replace("9", "-9");
    const result = parser.validate(notValidCell);
    expect(result).toEqual([
      {
        type: "cell",
        row: 1,
        column: 1,
        message: `Expected cell to be a positive number but received "-9".`,
      },
    ]);
  });

  it("should return the expected cart item object", () => {
    const line = validContent.split("\n")[1];
    const returnedItem = {
      id: mockId,
      name: "Mollis consequat",
      price: 9,
      quantity: 3,
    };
    const result = parser.parseLine(line);
    expect(result).toEqual(returnedItem);
  });

  it("should calculate the total price of items in the cart", () => {
    const items = [
      { id: mockId, name: "Mollis consequat", price: 9, quantity: 3 },
      { id: mockId, name: "Tvoluptatem", price: 10.32, quantity: 2 },
    ];
    const result = parser.calcTotal(items);
    expect(result).toBe(47.64);
  });

  
  it("should return empty items and zero total when card is empty", () => {
    const emptyCard = validContent.split("\n")[0];
    readFileSync.mockReturnValue(emptyCard);
    const result = parser.parse("path to file");
    expect(result).toEqual({
      items: [],
      total: 0,
    });
  });
});

describe("CartParser - integration test", () => {
  // Add your integration test here.
  it("should parse a valid CSV file and return the expected object", () => {
    readFileSync.mockReturnValue(validContent);
    const result = parser.parse("path to file");
    expect(result).toEqual({
      items: [
        { id: mockId, name: "Mollis consequat", price: 9, quantity: 3 },
        { id: mockId, name: "Tvoluptatem", price: 10.32, quantity: 2 },
      ],
      total: 47.64,
    });
  });
});
