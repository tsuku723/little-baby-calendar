import { execSync } from "node:child_process";

const compileCommand = [
  "npx tsc",
  "--module commonjs",
  "--target es2019",
  "--outDir .tmp-test",
  "--esModuleInterop",
  "--skipLibCheck",
  "src/models/dataModels.ts",
  "src/utils/dateUtils.ts",
  "src/utils/ageLabelNormalization.ts",
  "__tests__/age.dateUtils.test.ts",
  "__tests__/ageLabelNormalization.test.ts",
].join(" ");

execSync("rm -rf .tmp-test", { stdio: "inherit" });
execSync(compileCommand, { stdio: "inherit" });
execSync("node .tmp-test/__tests__/age.dateUtils.test.js", { stdio: "inherit" });
execSync("node .tmp-test/__tests__/ageLabelNormalization.test.js", { stdio: "inherit" });
