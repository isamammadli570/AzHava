import {matchesSearch, normalizeSearch} from "@/helpers/search";

describe("normalizeSearch", () => {
    it("folds Azerbaijani letters", () => {
        expect(normalizeSearch("  Şəki ")).toBe("seki");
        expect(normalizeSearch("Gəncə")).toBe("gence");
        expect(normalizeSearch("Lənkəran")).toBe("lenkeran");
        expect(normalizeSearch("İstanbul")).toBe("istanbul");
    });
});

describe("matchesSearch", () => {
    it("matches without diacritics and ignores an empty term", () => {
        expect(matchesSearch("Qəbələ", "qebe")).toBe(true);
        expect(matchesSearch("Bakı", "baki")).toBe(true);
        expect(matchesSearch("Bakı", "gen")).toBe(false);
        expect(matchesSearch("Bakı", "  ")).toBe(true);
    });
});
