import { describe, it, expect } from "vitest";
import {
  normalizeGoods,
  extractBrands,
  pickBestOffer,
  buildRows,
  formatApiError,
  toNumber,
  formatPrice,
} from "../lib/nomenclature";

describe("toNumber", () => {
  it("converts valid numbers", () => {
    expect(toNumber(10)).toBe(10);
    expect(toNumber("25.5")).toBe(25.5);
    expect(toNumber(0)).toBe(0);
  });

  it("returns 0 for invalid values", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber(NaN)).toBe(0);
  });
});

describe("formatApiError", () => {
  it("maps known error codes", () => {
    expect(formatApiError("Empty key!")).toBe("Не указан ключ покупателя.");
    expect(formatApiError("Invalid key client!")).toBe(
      "Неверный ключ покупателя: покупатель не найден."
    );
    expect(formatApiError("Empty number goods!")).toBe(
      "Не указан номер детали."
    );
    expect(formatApiError("Request quota exceeded!")).toBe(
      "Превышен лимит запросов к сервису."
    );
  });

  it("handles unknown error gracefully", () => {
    expect(formatApiError("Some unknown error")).toBe("Some unknown error");
  });

  it("joins array of errors", () => {
    const result = formatApiError(["Empty key!", "Empty number goods!"]);
    expect(result).toContain("Не указан ключ покупателя");
    expect(result).toContain("Не указан номер детали");
  });

  it("returns default for empty list", () => {
    expect(formatApiError([])).toBe("Веб-сервис вернул неизвестную ошибку.");
  });
});

describe("normalizeGoods", () => {
  it("returns filtered goods from valid response", () => {
    const response = {
      goods: [
        { number: "01089", brand: "NGK", name: "Свеча" },
        { number: "01089", brand: "BOSCH", name: "Свеча" },
      ],
    };
    expect(normalizeGoods(response)).toHaveLength(2);
  });

  it("filters out empty stub (item not found)", () => {
    const response = { goods: [{}] };
    expect(normalizeGoods(response)).toHaveLength(0);
  });

  it("throws on error field", () => {
    const response = { error: "Empty key!" };
    expect(() => normalizeGoods(response)).toThrow("Не указан ключ покупателя");
  });

  it("returns empty array for null input", () => {
    expect(normalizeGoods(null)).toEqual([]);
  });

  it("returns empty array for non-object input", () => {
    expect(normalizeGoods("not an object")).toEqual([]);
  });
});

describe("extractBrands", () => {
  it("collects unique brands and aggregates counts", () => {
    const goods = [
      { number: "01089", brand: "NGK", count: 5 },
      { number: "01089", brand: "NGK", count: 3 },
      { number: "01089", brand: "BOSCH", count: 10 },
    ];
    const result = extractBrands(goods);
    expect(result).toHaveLength(2);
    expect(result[0].brand).toBe("BOSCH");
    expect(result[0].positions).toBe(1);
    expect(result[0].stock).toBe(10);
    expect(result[1].brand).toBe("NGK");
    expect(result[1].positions).toBe(2);
    expect(result[1].stock).toBe(8);
  });

  it("skips items without brand", () => {
    const goods = [
      { number: "01089", name: "No brand" },
      { number: "01089", brand: "NGK" },
    ];
    const result = extractBrands(goods);
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe("NGK");
  });

  it("sorts brands alphabetically by Russian locale", () => {
    const goods = [
      { number: "01089", brand: "Z" },
      { number: "01089", brand: "A" },
      { number: "01089", brand: "M" },
    ];
    const result = extractBrands(goods);
    expect(result.map((b) => b.brand)).toEqual(["A", "M", "Z"]);
  });
});

describe("pickBestOffer", () => {
  it("picks warehouse with lowest price among in-stock", () => {
    const item = {
      warehouses: [
        { stock: 5, price: 100 },
        { stock: 0, price: 80 }, // out of stock
        { stock: 3, price: 90 },
      ],
    };
    const offer = pickBestOffer(item);
    expect(offer.price).toBe(90);
    expect(offer.stock).toBe(3);
  });

  it("returns null when no warehouse has stock", () => {
    const item = {
      warehouses: [
        { stock: 0, price: 100 },
        { stock: 0, price: 50 },
      ],
    };
    expect(pickBestOffer(item)).toBeNull();
  });

  it("handles item without warehouses array", () => {
    expect(pickBestOffer({})).toBeNull();
    expect(pickBestOffer(null)).toBeNull();
  });
});

describe("buildRows", () => {
  it("flattens goods with analogues", () => {
    const goods = [
      {
        goodsID: "1",
        brand: "NGK",
        number: "01089",
        name: "Свеча NGK",
        count: 5,
        warehouses: [{ stock: 5, price: 500, code: "МС2" }],
        analogues: [
          {
            goodsID: "2",
            brand: "BOSCH",
            number: "0986",
            name: "Свеча BOSCH",
            count: 10,
            warehouses: [{ stock: 10, price: 600, code: "МС2" }],
          },
          {
            goodsID: "3",
            brand: "DENSO",
            number: "12345",
            name: "Свеча DENSO",
            count: 2,
            warehouses: [{ stock: 2, price: 450, code: "Склад А" }],
          },
        ],
      },
    ];
    const rows = buildRows(goods);
    expect(rows).toHaveLength(3);
    expect(rows[0].isSearched).toBe(true);
    expect(rows[0].brand).toBe("NGK");
    expect(rows[0].price).toBe(500);
    expect(rows[1].brand).toBe("DENSO"); // cheapest analogue first
    expect(rows[1].isSearched).toBe(false);
  });

  it("deduplicates rows by key", () => {
    const goods = [
      {
        goodsID: "1",
        brand: "NGK",
        number: "01089",
        name: "X",
        count: 5,
        warehouses: [{ stock: 5, price: 100 }],
      },
      {
        goodsID: "2",
        brand: "BOSCH",
        number: "0986",
        name: "Y",
        count: 10,
        warehouses: [{ stock: 10, price: 200 }],
        analogues: [
          {
            goodsID: "1",
            brand: "NGK",
            number: "01089",
            name: "X",
            count: 5,
            warehouses: [{ stock: 5, price: 100 }],
          },
        ],
      },
    ];
    const rows = buildRows(goods);
    // NGK appears as searched and in BOSCH analogues — should be deduped
    expect(rows).toHaveLength(2);
  });

  it("sorts: original first, then by price ascending", () => {
    const goods = [
      {
        goodsID: "2",
        brand: "BOSCH",
        number: "0986",
        name: "Y",
        count: 10,
        warehouses: [{ stock: 10, price: 300 }],
        analogues: [
          {
            goodsID: "3",
            brand: "DENSO",
            number: "12345",
            name: "Z",
            count: 2,
            warehouses: [{ stock: 2, price: 150 }],
          },
          {
            goodsID: "4",
            brand: "NGK",
            number: "01089",
            name: "X",
            count: 5,
            warehouses: [{ stock: 5, price: 250 }],
          },
        ],
      },
    ];
    const rows = buildRows(goods);
    expect(rows[0].brand).toBe("BOSCH"); // original first
    expect(rows[1].brand).toBe("DENSO"); // 150
    expect(rows[2].brand).toBe("NGK"); // 250
  });

  it("handles items without analogues gracefully", () => {
    const goods = [
      {
        goodsID: "1",
        brand: "NGK",
        number: "01089",
        name: "X",
        count: 5,
        warehouses: [{ stock: 5, price: 100 }],
      },
    ];
    const rows = buildRows(goods);
    expect(rows).toHaveLength(1);
  });
});

describe("formatPrice", () => {
  it("formats a price with ruble sign", () => {
    const result = formatPrice(1234.5);
    expect(result).toContain("234,50");
    expect(result).toContain("₽");
  });

  it('returns "нет данных" for null', () => {
    expect(formatPrice(null)).toBe("нет данных");
  });

  it('returns "нет данных" for undefined', () => {
    expect(formatPrice(undefined)).toBe("нет данных");
  });
});
