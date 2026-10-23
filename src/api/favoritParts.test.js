import { describe, it, expect, vi } from "vitest";
import { buildUrl } from "../api/favoritParts";

// VITE_API_URL не определён в тестовой среде — fallback на прямой HTTPS-адрес сервиса
vi.stubEnv("VITE_API_URL", undefined);

describe("buildUrl", () => {
  it("builds minimal URL with key and number", () => {
    const url = buildUrl({ key: "abc-123", number: "01089" });
    expect(url).toContain("https://api.favorit-parts.ru/hs/hsprice/");
    expect(url).toContain("key=abc-123");
    expect(url).toContain("number=01089");
  });

  it("adds brand parameter", () => {
    const url = buildUrl({ key: "abc", number: "01089", brand: "NGK" });
    expect(url).toContain("brand=NGK");
    expect(url).not.toContain("analogues");
  });

  it("adds analogues=on when brand and analogues are set", () => {
    const url = buildUrl({
      key: "abc",
      number: "01089",
      brand: "NGK",
      analogues: true,
    });
    expect(url).toContain("analogues=on");
  });

  it("does NOT add analogues when brand is missing", () => {
    const url = buildUrl({ key: "abc", number: "01089", analogues: true });
    expect(url).not.toContain("analogues");
  });

  it("adds info=on when requested", () => {
    const url = buildUrl({ key: "abc", number: "01089", info: "on" });
    expect(url).toContain("info=on");
  });

  it("escapes special characters in brand name", () => {
    const url = buildUrl({
      key: "abc",
      number: "01089",
      brand: "CAFFARO & ZEN",
    });
    expect(url).toContain("%26");
  });

  it("escapes hash in number", () => {
    const url = buildUrl({ key: "abc", number: "1%23ABC" });
    // URLSearchParams encodes % -> %25
    expect(url).toContain("%2523");
  });

  it("ignores empty string parameters", () => {
    const url = buildUrl({ key: "abc", number: "", brand: "" });
    expect(url).not.toContain("number");
    expect(url).not.toContain("brand");
  });
});
