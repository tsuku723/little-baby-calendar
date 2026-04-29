"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const ageLabelNormalization_1 = require("../src/utils/ageLabelNormalization");
strict_1.default.equal((0, ageLabelNormalization_1.stripChronologicalPrefix)("暦 1才2ヶ月"), "1才2ヶ月");
strict_1.default.equal((0, ageLabelNormalization_1.stripChronologicalPrefix)("月齢 3ヶ月"), "3ヶ月");
strict_1.default.equal((0, ageLabelNormalization_1.stripChronologicalPrefix)(null), null);
// 空白（半角・全角）が混在しても null に正規化されること
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)("   "), null);
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)("　"), null);
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)(" 　\t "), null);
// ゼロ値は falsy 判定で消えないこと
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)("0ヶ月"), "0ヶ月");
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)("0週"), "0週");
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)(0), 0);
strict_1.default.equal((0, ageLabelNormalization_1.normalizeAgeLabelText)("0"), "0");
console.log("ageLabelNormalization tests passed");
