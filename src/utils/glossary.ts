export const GLOSSARY = {
  apy: "The annual percentage yield — the real rate of return earned on your deposited funds over one year, including compound interest.",
  tvl: "Total value locked — the combined worth of all assets currently deposited in the vault by all users.",
  slippage: "The potential difference between the expected price and the actual executed price when a trade or deposit is submitted.",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
