// contracts/oracles/GoogleFitOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract GoogleFitOracle is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct VerifiedData {
        uint64 steps;
        uint64 calories;
        uint64 heartRate;
        uint64 timestamp;
        bool verified;
        address verifier;
    }
    
    mapping(address => mapping(uint64 => VerifiedData)) public userVerifiedData;
    mapping(address => bool) public authorizedVerifiers;
    
    // Trusted signer address (backend service that signs health data)
    address public trustedSigner;
    
    event DataVerified(
        address indexed user,
        uint64 steps,
        uint64 calories,
        uint64 heartRate,
        uint64 date,
        address verifier
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        _;
    }
    
    constructor(address _trustedSigner) Ownable(msg.sender) {
        require(_trustedSigner != address(0), "Invalid signer address");
        trustedSigner = _trustedSigner;
        authorizedVerifiers[msg.sender] = true;
    }
    
    function setTrustedSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        address oldSigner = trustedSigner;
        trustedSigner = _newSigner;
        emit TrustedSignerUpdated(oldSigner, _newSigner);
    }
    
    function addVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }
    
    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }
    
    function verifyHealthData(
        address _user,
        uint64 _steps,
        uint64 _calories,
        uint64 _heartRate,
        uint64 _timestamp,
        bytes memory _signature
    ) external onlyVerifier returns (bool) {
        uint64 date = _timestamp / 1 days;
        
        // Input validation
        require(_steps <= 50000, "Invalid steps");
        require(_calories <= 20000, "Invalid calories");
        require(_heartRate >= 40 && _heartRate <= 220, "Invalid heart rate");
        require(_signature.length == 65, "Invalid signature length");
        
        // Create message hash from health data
        bytes32 messageHash = keccak256(abi.encodePacked(
            _user,
            _steps,
            _calories,
            _heartRate,
            _timestamp
        ));
        
        // Convert to Ethereum signed message hash
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        
        // Recover signer from signature
        address recoveredSigner = ethSignedHash.recover(_signature);
        
        // Verify the signature is from trusted signer
        require(recoveredSigner == trustedSigner, "Invalid signature");
        
        userVerifiedData[_user][date] = VerifiedData({
            steps: _steps,
            calories: _calories,
            heartRate: _heartRate,
            timestamp: _timestamp,
            verified: true,
            verifier: msg.sender
        });
        
        emit DataVerified(_user, _steps, _calories, _heartRate, date, msg.sender);
        return true;
    }
    
    function isDataVerified(address _user, uint64 _date) external view returns (bool) {
        return userVerifiedData[_user][_date].verified;
    }
    
    function getTrustedSigner() external view returns (address) {
        return trustedSigner;
    }
}
