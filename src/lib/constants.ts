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

type Asset = { symbol: string; address: string; decimals: number; vaultAddress: string };

export const CHAIN_METADATA = {
  [SUPPORTED_CHAINS.BASE]: { id: SUPPORTED_CHAINS.BASE, key: "base", name: "Base Mainnet", shortName: "Base" },
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: { id: SUPPORTED_CHAINS.BASE_SEPOLIA, key: "baseSepolia", name: "Base Sepolia", shortName: "Base Sepolia" },
} as const;

const MAINNET_ASSETS: Asset[] = [
  { symbol: "USDC", address: import.meta.env.VITE_BASE_USDC_ADDRESS || '', decimals: 6, vaultAddress: import.meta.env.VITE_BASE_VAULT_ADDRESS || '' },
  { symbol: "WETH", address: import.meta.env.VITE_BASE_WETH_ADDRESS || '', decimals: 18, vaultAddress: import.meta.env.VITE_BASE_VAULT_ADDRESS || '' },
  { symbol: "cbBTC", address: import.meta.env.VITE_BASE_CBBTC_ADDRESS || '', decimals: 8, vaultAddress: import.meta.env.VITE_BASE_VAULT_ADDRESS || '' },
  { symbol: "DAI", address: import.meta.env.VITE_BASE_DAI_ADDRESS || '', decimals: 18, vaultAddress: import.meta.env.VITE_BASE_VAULT_ADDRESS || '' },
  { symbol: "USDbC", address: import.meta.env.VITE_BASE_USDBC_ADDRESS || '', decimals: 6, vaultAddress: import.meta.env.VITE_BASE_VAULT_ADDRESS || '' },
].filter((a): a is Asset => isAddress(a.address) && isAddress(a.vaultAddress));

const SEPOLIA_ASSETS: Asset[] = [
  { symbol: "USDC", address: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_USDC_ADDRESS, "VITE_BASE_SEPOLIA_USDC_ADDRESS"), decimals: 6, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") },
  { symbol: "WETH", address: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_WETH_ADDRESS, "VITE_BASE_SEPOLIA_WETH_ADDRESS"), decimals: 18, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") },
  { symbol: "cbBTC", address: import.meta.env.VITE_BASE_SEPOLIA_CBBTC_ADDRESS || '', decimals: 8, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") },
  { symbol: "DAI", address: import.meta.env.VITE_BASE_SEPOLIA_DAI_ADDRESS || '', decimals: 18, vaultAddress: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS") },
].filter((a): a is Asset => isAddress(a.address) && isAddress(a.vaultAddress));

export const ASSETS: Record<number, Asset[]> = {
  [SUPPORTED_CHAINS.BASE]: MAINNET_ASSETS,
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: SEPOLIA_ASSETS,
};

export const VAULT_SYSTEM = {
  [SUPPORTED_CHAINS.BASE]: {
    VAULT: optionalAddress(import.meta.env.VITE_BASE_VAULT_ADDRESS),
    TREASURY: optionalAddress(import.meta.env.VITE_BASE_TREASURY_ADDRESS),
    FACTORY: optionalAddress(import.meta.env.VITE_BASE_FACTORY_ADDRESS),
    ORACLE: optionalAddress(import.meta.env.VITE_BASE_ORACLE_ADDRESS),
    AAVE_ADAPTER: optionalAddress(import.meta.env.VITE_BASE_AAVE_ADAPTER_ADDRESS || import.meta.env.VITE_BASE_ADAPTER_ADDRESS),
    UNISWAP_ADAPTER: optionalAddress(import.meta.env.VITE_BASE_UNISWAP_ADAPTER_ADDRESS),
    QUICKSWAP_ADAPTER: optionalAddress(import.meta.env.VITE_BASE_QUICKSWAP_ADAPTER_ADDRESS),
    BALANCER_ADAPTER: optionalAddress(import.meta.env.VITE_BASE_BALANCER_ADAPTER_ADDRESS)
  },
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: {
    VAULT: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_VAULT_ADDRESS, "VITE_BASE_SEPOLIA_VAULT_ADDRESS"),
    TREASURY: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_TREASURY_ADDRESS, "VITE_BASE_SEPOLIA_TREASURY_ADDRESS"),
    FACTORY: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_FACTORY_ADDRESS, "VITE_BASE_SEPOLIA_FACTORY_ADDRESS"),
    ORACLE: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_ORACLE_ADDRESS, "VITE_BASE_SEPOLIA_ORACLE_ADDRESS"),
    AAVE_ADAPTER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_AAVE_ADAPTER_ADDRESS || import.meta.env.VITE_BASE_SEPOLIA_ADAPTER_ADDRESS, "VITE_BASE_SEPOLIA_AAVE_ADAPTER_ADDRESS|VITE_BASE_SEPOLIA_ADAPTER_ADDRESS"),
    UNISWAP_ADAPTER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_UNISWAP_ADAPTER_ADDRESS, "VITE_BASE_SEPOLIA_UNISWAP_ADAPTER_ADDRESS"),
    QUICKSWAP_ADAPTER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_QUICKSWAP_ADAPTER_ADDRESS, "VITE_BASE_SEPOLIA_QUICKSWAP_ADAPTER_ADDRESS"),
    BALANCER_ADAPTER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_BALANCER_ADAPTER_ADDRESS, "VITE_BASE_SEPOLIA_BALANCER_ADAPTER_ADDRESS")
  }
};

export const PROTOCOLS = {
  [SUPPORTED_CHAINS.BASE]: {
    AAVE_V3_POOL: optionalAddress(import.meta.env.VITE_BASE_AAVE_V3_POOL),
    UNISWAP_V3_FACTORY: optionalAddress(import.meta.env.VITE_BASE_UNISWAP_V3_FACTORY),
    AERODROME_ROUTER: optionalAddress(import.meta.env.VITE_BASE_AERODROME_ROUTER),
    MOONWELL_COMPTROLLER: optionalAddress(import.meta.env.VITE_BASE_MOONWELL_COMPTROLLER),
    MORPHO: optionalAddress(import.meta.env.VITE_BASE_MORPHO)
  },
  [SUPPORTED_CHAINS.BASE_SEPOLIA]: {
    AAVE_V3_POOL: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_AAVE_V3_POOL, "VITE_BASE_SEPOLIA_AAVE_V3_POOL"),
    UNISWAP_V3_FACTORY: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_UNISWAP_V3_FACTORY, "VITE_BASE_SEPOLIA_UNISWAP_V3_FACTORY"),
    AERODROME_ROUTER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_AERODROME_ROUTER, "VITE_BASE_SEPOLIA_AERODROME_ROUTER"),
    MOONWELL_COMPTROLLER: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_MOONWELL_COMPTROLLER, "VITE_BASE_SEPOLIA_MOONWELL_COMPTROLLER"),
    MORPHO: requiredAddress(import.meta.env.VITE_BASE_SEPOLIA_MORPHO, "VITE_BASE_SEPOLIA_MORPHO")
  }
};
