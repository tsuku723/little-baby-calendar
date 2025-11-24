declare module "uuid" {
  export function v4(options?: { random?: number[]; rng?: () => number[] }): string;
}
