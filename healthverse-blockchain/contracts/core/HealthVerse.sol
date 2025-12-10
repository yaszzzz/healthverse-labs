// contracts/core/HealthVerse.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHealthToken.sol";
import "../interfaces/IGoogleFitOracle.sol";

contract HealthVerse is Ownable {
    struct HealthData {
        uint64 steps;
        uint64 calories; 
        uint64 heartRate;
        uint64 timestamp;
    }

    struct DailySummary {
        uint64 totalSteps;
        uint64 totalCalories;
        uint64 date;
        uint8 rewardClaimed; // 0 = not claimed, 1 = claimed
        bool oracleVerified;
    }

    // Constants
    uint64 public immutable DAILY_GOAL_STEPS = 6000;
    uint64 public immutable DAILY_GOAL_CALORIES = 2000;
    uint64 public immutable REWARD_AMOUNT = 10 * 10**18;

    // Token & Oracle Contracts
    IHealthToken public healthToken;
    IGoogleFitOracle public googleFitOracle;
    
    // Mappings
    mapping(address => mapping(uint64 => DailySummary)) public userDailyData;
    mapping(address => uint64) public lastActivityDate;
    mapping(address => bool) public bannedUsers;
    
    bool public contractPaused;
    bool public requireOracleVerification; // Switch untuk enable/disable oracle

    // Events
    event HealthDataAdded(address indexed user, uint64 steps, uint64 calories, uint64 date);
    event RewardClaimed(address indexed user, uint64 rewardAmount, uint64 date);
    event UserBanned(address indexed user);
    event ContractPaused(bool paused);
    event OracleVerificationToggled(bool required);
    event EmergencyWithdraw(address indexed token, uint256 amount, address to);

    modifier whenNotPaused() {
        require(!contractPaused, "Contract paused");
        _;
    }

    modifier notBanned() {
        require(!bannedUsers[msg.sender], "User banned");
        _;
    }

    constructor(address _healthToken, address _oracle) Ownable(msg.sender) {
        healthToken = IHealthToken(_healthToken);
        googleFitOracle = IGoogleFitOracle(_oracle);
        requireOracleVerification = false; // Default disabled untuk development
    }

    // Add health data dengan optional oracle verification
    function addHealthData(
        uint64 _steps,
        uint64 _calories,
        uint64 _heartRate,
        bytes memory _signature // Signature dari Google Fit (bisa kosong jika oracle disabled)
    ) external whenNotPaused notBanned {
        require(_heartRate >= 40 && _heartRate <= 220, "Invalid heart rate");
        require(_steps <= 50000, "Steps too high");
        require(_calories <= 20000, "Calories too high");
        
        uint64 today = uint64(block.timestamp / 1 days);
        
        // Anti-spam: overflow protection
        require(userDailyData[msg.sender][today].totalSteps + _steps >= _steps, "Overflow protection");
        
        DailySummary storage summary = userDailyData[msg.sender][today];
        
        // Jika oracle verification required, verify data
        if (requireOracleVerification) {
            bool verified = googleFitOracle.verifyHealthData(
                msg.sender,
                _steps,
                _calories,
                _heartRate,
                uint64(block.timestamp),
                _signature
            );
            require(verified, "Oracle verification failed");
            summary.oracleVerified = true;
        }
        
        summary.totalSteps += _steps;
        summary.totalCalories += _calories;
        summary.date = today;
        
        lastActivityDate[msg.sender] = today;
        
        emit HealthDataAdded(msg.sender, _steps, _calories, today);
    }

    // Claim reward dengan token minting
    function claimReward(uint64 _date) external whenNotPaused notBanned {
        require(_date < (block.timestamp / 1 days), "Cannot claim for today/future");
        
        DailySummary storage summary = userDailyData[msg.sender][_date];
        
        require(summary.totalSteps >= DAILY_GOAL_STEPS, "Steps goal not reached");
        require(summary.totalCalories >= DAILY_GOAL_CALORIES, "Calories goal not reached");
        require(summary.rewardClaimed == 0, "Reward already claimed");
        
        // Jika oracle verification enabled, pastikan data terverifikasi
        if (requireOracleVerification) {
            require(summary.oracleVerified, "Data not oracle verified");
        }
        
        // Mark as claimed BEFORE transfer (CEI pattern)
        summary.rewardClaimed = 1;
        
        uint64 reward = _calculateReward(summary.totalSteps, summary.totalCalories);
        require(reward > 0, "No reward available");
        
        // Mint tokens ke user
        healthToken.mintRewards(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward, _date);
    }

    // Calculate reward dengan overflow protection
    function _calculateReward(uint64 _steps, uint64 _calories) internal pure returns (uint64) {
        if (_steps >= 10000 && _calories >= 3000) {
            return REWARD_AMOUNT * 2;
        }
        if (_steps >= 8000 && _calories >= 2500) {
            return REWARD_AMOUNT * 3 / 2;
        }
        if (_steps >= DAILY_GOAL_STEPS && _calories >= DAILY_GOAL_CALORIES) {
            return REWARD_AMOUNT;
        }
        return 0;
    }

    // ==================== ADMIN FUNCTIONS ====================

    function toggleOracleVerification(bool _required) external onlyOwner {
        requireOracleVerification = _required;
        emit OracleVerificationToggled(_required);
    }

    function setHealthToken(address _token) external onlyOwner {
        healthToken = IHealthToken(_token);
    }

    function setOracle(address _oracle) external onlyOwner {
        googleFitOracle = IGoogleFitOracle(_oracle);
    }

    function pauseContract() external onlyOwner {
        contractPaused = true;
        emit ContractPaused(true);
    }

    function unpauseContract() external onlyOwner {
        contractPaused = false;
        emit ContractPaused(false);
    }

    function banUser(address _user) external onlyOwner {
        bannedUsers[_user] = true;
        emit UserBanned(_user);
    }

    function unbanUser(address _user) external onlyOwner {
        bannedUsers[_user] = false;
    }

    // FIXED: Emergency withdraw menggunakan low-level call
    function emergencyWithdrawToken(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Interface untuk ERC20 transfer
        (bool success, ) = _token.call(
            abi.encodeWithSignature("transfer(address,uint256)", owner(), _amount)
        );
        require(success, "Token transfer failed");
        
        emit EmergencyWithdraw(_token, _amount, owner());
    }

    // ==================== VIEW FUNCTIONS ====================

    function getTodayProgress(address _user) external view returns (
        uint64 steps,
        uint64 calories,
        bool stepsGoalReached,
        bool caloriesGoalReached,
        bool canClaimReward,
        bool oracleVerified
    ) {
        uint64 today = uint64(block.timestamp / 1 days);
        DailySummary memory summary = userDailyData[_user][today];
        
        steps = summary.totalSteps;
        calories = summary.totalCalories;
        stepsGoalReached = steps >= DAILY_GOAL_STEPS;
        caloriesGoalReached = calories >= DAILY_GOAL_CALORIES;
        canClaimReward = stepsGoalReached && caloriesGoalReached && summary.rewardClaimed == 0;
        oracleVerified = summary.oracleVerified;
        
        return (steps, calories, stepsGoalReached, caloriesGoalReached, canClaimReward, oracleVerified);
    }

    function getUserStatus(address _user) external view returns (
        bool isBanned,
        uint64 lastActive,
        bool isContractPaused,
        bool oracleRequired
    ) {
        return (
            bannedUsers[_user],
            lastActivityDate[_user],
            contractPaused,
            requireOracleVerification
        );
    }

    function getDailyData(address _user, uint64 _date) external view returns (
        uint64 steps,
        uint64 calories,
        uint8 rewardStatus,
        bool oracleVerified
    ) {
        DailySummary memory summary = userDailyData[_user][_date];
        return (summary.totalSteps, summary.totalCalories, summary.rewardClaimed, summary.oracleVerified);
    }

    // Get contract addresses
    function getContractAddresses() external view returns (
        address tokenAddress,
        address oracleAddress
    ) {
        return (address(healthToken), address(googleFitOracle));
    }
}