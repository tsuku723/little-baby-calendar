import assert from "node:assert/strict";

import { normalizeAgeLabelText, stripChronologicalPrefix } from "../src/utils/ageLabelNormalization";

assert.equal(stripChronologicalPrefix("暦 1才2ヶ月"), "1才2ヶ月");
assert.equal(stripChronologicalPrefix("月齢 3ヶ月"), "3ヶ月");
assert.equal(stripChronologicalPrefix(null), null);

// 空白（半角・全角）が混在しても null に正規化されること
assert.equal(normalizeAgeLabelText("   "), null);
assert.equal(normalizeAgeLabelText("　"), null);
assert.equal(normalizeAgeLabelText(" 　\t "), null);

// ゼロ値は falsy 判定で消えないこと
assert.equal(normalizeAgeLabelText("0ヶ月"), "0ヶ月");
assert.equal(normalizeAgeLabelText("0週"), "0週");
assert.equal(normalizeAgeLabelText(0), 0);
assert.equal(normalizeAgeLabelText("0"), "0");

console.log("ageLabelNormalization tests passed");
