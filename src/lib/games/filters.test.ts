import { describe, expect, it } from "vitest";

import { countActiveFilters, parseGameFilters, serializeGameFilters } from "./filters";

const parse = (query: string) => parseGameFilters(new URLSearchParams(query));

describe("parseGameFilters", () => {
  it("defaults to relevance, page 1", () => {
    expect(parse("")).toEqual({ filters: { sort: "relevance", page: 1 }, invalid: [] });
  });

  it("reads every supported filter", () => {
    expect(
      parse("q=%20elden%20%20ring%20&genre=action&platform=pc&year=2022&score=80&sort=rating&page=3")
        .filters,
    ).toEqual({
      q: "elden ring",
      genre: "action",
      platform: "pc",
      year: 2022,
      score: 80,
      sort: "rating",
      page: 3,
    });
  });

  it("reports invalid values and falls back to defaults for them", () => {
    const { filters, invalid } = parse(
      "genre=../etc&platform=PC&year=1200&score=85&sort=price&page=0",
    );
    expect(filters).toEqual({ sort: "relevance", page: 1 });
    expect(invalid).toEqual(["genre", "platform", "year", "score", "sort", "page"]);
  });

  it("rejects over-long searches and absurd pages", () => {
    expect(parse(`q=${"a".repeat(81)}`).invalid).toEqual(["q"]);
    expect(parse("page=501").invalid).toEqual(["page"]);
    expect(parse("page=1e3").invalid).toEqual(["page"]);
  });

  it("ignores parameters it does not know", () => {
    expect(parse("key=secret&dates=1,2&ordering=-added")).toEqual({
      filters: { sort: "relevance", page: 1 },
      invalid: [],
    });
  });
});

describe("serializeGameFilters", () => {
  it("omits defaults so URLs stay canonical", () => {
    expect(serializeGameFilters({ sort: "relevance", page: 1 }).toString()).toBe("");
  });

  it("round-trips through parse", () => {
    const filters = {
      q: "hollow knight",
      genre: "indie",
      platform: "nintendo",
      year: 2017,
      score: 90 as const,
      sort: "metascore" as const,
      page: 2,
    };
    expect(parseGameFilters(serializeGameFilters(filters)).filters).toEqual(filters);
  });
});

describe("countActiveFilters", () => {
  it("counts filters but not search, sort or page", () => {
    expect(
      countActiveFilters({ q: "x", genre: "action", year: 2020, sort: "name", page: 4 }),
    ).toBe(2);
  });
});
