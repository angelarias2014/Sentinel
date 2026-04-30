export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
] as const;

export const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
  "function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
  "function getReserveData(address asset) view returns (uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint8 id)"
] as const;

export const UNISWAP_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
] as const;

export const BALANCER_VAULT_ABI = [
  "function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)",
  "function swap((bytes32 poolId, uint8 kind, address assetIn, address assetOut, uint256 amount, bytes userData), (address sender, bool fromInternalBalance, address recipient, bool toInternalBalance), uint256 limit, uint256 deadline) external payable returns (uint256)",
  "function getInternalBalance(address user, address[] tokens) view returns (uint256[])"
] as const;

export const SENTINEL_VAULT_ABI = [
  // ERC4626 standard
  "function deposit(uint256 assets, address receiver) external returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares)",
  "function maxDeposit(address) external view returns (uint256)",
  "function previewDeposit(uint256 assets) external view returns (uint256)",
  "function maxWithdraw(address owner) external view returns (uint256)",
  "function previewWithdraw(uint256 assets) external view returns (uint256)",
  "function totalAssets() external view returns (uint256)",
  "function convertToShares(uint256 assets) external view returns (uint256)",
  "function convertToAssets(uint256 shares) external view returns (uint256)",
  
  // Custom Sentinel variables
  "function lastRiskScore() external view returns (uint256)",
  "function riskThreshold() external view returns (uint256)",
  "function isEmergencyShieldActive() external view returns (bool)",
  "function depositFeeBps() external view returns (uint256)",
  "function withdrawFeeBps() external view returns (uint256)",
  "function FEE_DENOMINATOR() external view returns (uint256)",
  
  // Standard ERC20 inherited through ERC4626
  "function balanceOf(address account) external view returns (uint256)"
] as const;

export const UNISWAP_FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)"
] as const;

export const CURVE_POOL_ABI = [
  "function balances(uint256 i) view returns (uint256)",
  "function get_virtual_price() view returns (uint256)"
] as const;
