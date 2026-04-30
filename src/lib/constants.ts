export const SUPPORTED_CHAINS = {
  BASE: 8453,
  BASE_SEPOLIA: 84532
} as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const isAddress = (value?: string) => !!value && /^0x[a-fA-F0-9]{40}$/.test(value) && value !== ZERO_ADDRESS;
const requiredAddress = (value: string | undefined, label: string) => {
  if (!isAddress(value)) throw new Error(`Missing or invalid address for ${label}`);
  return value;
};
const optionalAddress = (value?: string) => (isAddress(value) ? value : undefined);

export const CHAIN_METADATA = {
  [SUPPORTED_CHAINS.BASE]: {
    id: SUPPORTED_CHAINS.BASE,
    key: "base",
    name: "Base Mainnet",
    shortName: "Base",
  },
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: {
    id: SUPPORTED_CHAINS.BASE_SEPOLIA,
    key: "baseSepolia",
    name: "Base Sepolia",
    shortName: "Base Sepolia",
  },
} as const;

export const ASSETS = {
  [SUPPORTED_CHAINS.BASE]: [
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS, "VITE_BASE_VAULT_ADDRESS") },
    { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS, "VITE_BASE_VAULT_ADDRESS") },
    { symbol: "cbBTC", address: "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", decimals: 8, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS, "VITE_BASE_VAULT_ADDRESS") },
    { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS, "VITE_BASE_VAULT_ADDRESS") },
    { symbol: "USDbC", address: "0xd9aaec86b65d86f6a7b5d2f98f7b06be0c5a3f44", decimals: 6, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS, "VITE_BASE_VAULT_ADDRESS") }
  ],
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: [
    { symbol: "USDC", address: import.meta.env.VITE_BASE_SEPOLIA_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e", decimals: 6, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") },
    { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") },
  ].concat(optionalAddress(import.meta.env.VITE_BASE_SEPOLIA_CBBTC_ADDRESS) ? [{ symbol: "cbBTC", address: import.meta.env.VITE_BASE_SEPOLIA_CBBTC_ADDRESS!, decimals: 8, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") }] : [])
   .concat(optionalAddress(import.meta.env.VITE_BASE_SEPOLIA_DAI_ADDRESS) ? [{ symbol: "DAI", address: import.meta.env.VITE_BASE_SEPOLIA_DAI_ADDRESS!, decimals: 18, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") }] : [])
};

export const VAULT_SYSTEM = {
  [SUPPORTED_CHAINS.BASE]: {
    VAULT: requiredAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS, "VITE_BASE_VAULT_ADDRESS"),
    TREASURY: requiredAddress(import.meta.env.VITE_BASE_TREASURY_ADDRESS, "VITE_BASE_TREASURY_ADDRESS"),
    FACTORY: requiredAddress(import.meta.env.VITE_BASE_FACTORY_ADDRESS, "VITE_BASE_FACTORY_ADDRESS"),
    ORACLE: requiredAddress(import.meta.env.VITE_BASE_ORACLE_ADDRESS, "VITE_BASE_ORACLE_ADDRESS")
  },
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: {
    VAULT: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS"),
    TREASURY: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_TREASURY_ADDRESS, "VITE_BASE_SEPOLIA_TREASURY_ADDRESS"),
    FACTORY: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_FACTORY_ADDRESS, "VITE_BASE_SEPOLIA_FACTORY_ADDRESS"),
    ORACLE: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_ORACLE_ADDRESS, "VITE_BASE_SEPOLIA_ORACLE_ADDRESS")
  }
};

export const PROTOCOLS = {
  [SUPPORTED_CHAINS.BASE]: {
    AAVE_V3_POOL: import.meta.env.VITE_BASE_AAVE_V3_POOL || "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    UNISWAP_V3_FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    AERODROME_ROUTER: requiredAddress(import.meta.env.VITE_BASE_AERODROME_ROUTER, "VITE_BASE_AERODROME_ROUTER"),
    MOONWELL_COMPTROLLER: requiredAddress(import.meta.env.VITE_BASE_MOONWELL_COMPTROLLER, "VITE_BASE_MOONWELL_COMPTROLLER"),
    MORPHO: requiredAddress(import.meta.env.VITE_BASE_MORPHO, "VITE_BASE_MORPHO")
  },
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: {
    AAVE_V3_POOL: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_AAVE_V3_POOL, "VITE_BASE_SEPOLIA_AAVE_V3_POOL"),
    UNISWAP_V3_FACTORY: import.meta.env.VITE_BASE_SEPOLIA_UNISWAP_V3_FACTORY || "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    AERODROME_ROUTER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_AERODROME_ROUTER, "VITE_BASE_SEPOLIA_AERODROME_ROUTER"),
    MOONWELL_COMPTROLLER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_MOONWELL_COMPTROLLER, "VITE_BASE_SEPOLIA_MOONWELL_COMPTROLLER"),
    MORPHO: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_MORPHO, "VITE_BASE_SEPOLIA_MORPHO")
  }
};
