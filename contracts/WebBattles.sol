// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WebBattles {
    struct Challenge {
        address owner;
        address challenged;
        uint256 betAmount;
        string ownerVideoUrl;
        string challengedVideoUrl;
    }

    IERC20 public immutable moovToken;
    mapping(uint32 => Challenge) public challenges;

    event ChallengeCreated(uint32 challengeId, address owner, uint256 betAmount);
    event ChallengeAccepted(uint32 challengeId, address challenged);
    event ChallengeWinnerAssigned(uint32 challengeId, address winner, uint256 amountWon, string ownerVideoUrl, string challengedVideoUrl);
    event ChallengeCancelled(uint32 challengeId, address owner);

    constructor(address _moovTokenAddress) {
        moovToken = IERC20(_moovTokenAddress);
    }

    modifier challengeExists(uint32 challengeId) {
        require(challenges[challengeId].owner != address(0), "Challenge does not exist");
        _;
    }

    modifier onlyChallengeOwner(uint32 challengeId) {
        require(msg.sender == challenges[challengeId].owner, "Only the challenge owner can perform this action");
        _;
    }

    modifier challengeAccepted(uint32 challengeId) {
        require(challenges[challengeId].challenged != address(0), "Challenge not yet accepted");
        _;
    }

    modifier challengeNotAccepted(uint32 challengeId) {
        require(challenges[challengeId].challenged == address(0), "Challenge already accepted");
        _;
    }

    function createChallenge(uint32 challengeId, uint256 betAmount) public {
        require(betAmount > 0, "Bet amount must be greater than zero");
        require(challenges[challengeId].owner == address(0), "Challenge ID already used");

        challenges[challengeId] = Challenge({
            owner: msg.sender,
            challenged: address(0),
            betAmount: betAmount,
            ownerVideoUrl: "",
            challengedVideoUrl: ""
        });

        require(moovToken.transferFrom(msg.sender, address(this), betAmount), "Token transfer failed");

        emit ChallengeCreated(challengeId, msg.sender, betAmount);
    }

    function acceptChallenge(uint32 challengeId) public challengeExists(challengeId) challengeNotAccepted(challengeId) {
        Challenge storage challenge = challenges[challengeId];

        challenge.challenged = msg.sender;

        require(moovToken.transferFrom(msg.sender, address(this), challenge.betAmount), "Token transfer failed");

        emit ChallengeAccepted(challengeId, msg.sender);
    }

    function assignChallengeWinner(uint32 challengeId, bool isOwnerWinner, string memory ownerVideoUrl, string memory challengedVideoUrl) public 
        challengeExists(challengeId) 
        challengeAccepted(challengeId) 
    {
        Challenge storage challenge = challenges[challengeId];

        address winner = isOwnerWinner ? challenge.owner : challenge.challenged;

        uint256 totalAmount = challenge.betAmount * 2;

        challenge.ownerVideoUrl = ownerVideoUrl;
        challenge.challengedVideoUrl = challengedVideoUrl;

        require(moovToken.transfer(winner, totalAmount), "Token transfer to winner failed");

        emit ChallengeWinnerAssigned(challengeId, winner, totalAmount, ownerVideoUrl, challengedVideoUrl);
    }

    function cancelChallenge(uint32 challengeId) public onlyChallengeOwner(challengeId) challengeNotAccepted(challengeId) {
        Challenge storage challenge = challenges[challengeId];

        require(moovToken.transfer(challenge.owner, challenge.betAmount), "Refund to owner failed");

        emit ChallengeCancelled(challengeId, challenge.owner);
    }
}