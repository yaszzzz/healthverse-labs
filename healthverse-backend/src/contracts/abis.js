// Contract ABIs for HealthVerse blockchain integration
// Only ABI is needed for contract interactions (no bytecode)

export const HEALTHVERSE_ABI = [
    "function addHealthData(uint64 _steps, uint64 _calories, uint64 _heartRate, bytes _signature) external",
    "function claimReward(uint64 _date) external",
    "function getTodayProgress(address _user) external view returns (uint64 steps, uint64 calories, bool stepsGoalReached, bool caloriesGoalReached, bool canClaimReward, bool oracleVerified)",
    "function getUserStatus(address _user) external view returns (bool isBanned, uint64 lastActive, bool isContractPaused, bool oracleRequired)",
    "function getDailyData(address _user, uint64 _date) external view returns (uint64 steps, uint64 calories, uint8 rewardStatus, bool oracleVerified)",
    "function getContractAddresses() external view returns (address tokenAddress, address oracleAddress)",
    "function DAILY_GOAL_STEPS() external view returns (uint64)",
    "function DAILY_GOAL_CALORIES() external view returns (uint64)",
    "function REWARD_AMOUNT() external view returns (uint64)",
    "event HealthDataAdded(address indexed user, uint64 steps, uint64 calories, uint64 date)",
    "event RewardClaimed(address indexed user, uint64 rewardAmount, uint64 date)"
];

export const HEALTH_TOKEN_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function totalSupply() external view returns (uint256)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const GOOGLE_FIT_ORACLE_ABI = [
    "function verifyHealthData(address _user, uint64 _steps, uint64 _calories, uint64 _heartRate, uint64 _timestamp, bytes _signature) external returns (bool)",
    "function isDataVerified(address _user, uint64 _date) external view returns (bool)",
    "function trustedSigner() external view returns (address)",
    "function authorizedVerifiers(address) external view returns (bool)",
    "event DataVerified(address indexed user, uint64 steps, uint64 calories, uint64 heartRate, uint64 date, address verifier)"
];
