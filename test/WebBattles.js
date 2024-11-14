const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("WebBattles Full Flow Integration Test", function () {
  async function deployAndSetupContracts() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const dotmoovsToken = await ethers.deployContract("Dotmoovs");
    const webBattles = await ethers.deployContract("WebBattles", [dotmoovsToken.target]);

    const initialAmount = ethers.parseUnits("100", 18);
    // Transfer tokens to both addr1 and addr2
    await dotmoovsToken.transfer(addr1.address, initialAmount);
    await dotmoovsToken.transfer(addr2.address, initialAmount);

    return { dotmoovsToken, webBattles, owner, addr1, addr2, initialAmount };
  }

  it("Should execute the full WebBattles flow from creating a challenge to rewarding the winner", async function () {
    const { dotmoovsToken, webBattles, addr1, addr2 } = await loadFixture(deployAndSetupContracts);
  
    const initialAmount = ethers.parseUnits("100", 18);  // Assume both start with 100 tokens
    const betAmount = ethers.parseUnits("50", 18);       // Set bet amount to 50 tokens
    const challengeId = 1;
  
    console.log(`Starting balances:`);
    console.log(`Addr1: ${ethers.formatUnits(await dotmoovsToken.balanceOf(addr1.address), 18)} tokens`);
    console.log(`Addr2: ${ethers.formatUnits(await dotmoovsToken.balanceOf(addr2.address), 18)} tokens`);
    console.log(`Contract: ${ethers.formatUnits(await dotmoovsToken.balanceOf(webBattles.target), 18)} tokens`);
  
    // Step 1: addr1 Creates a Challenge
    await dotmoovsToken.connect(addr1).approve(webBattles.target, betAmount);
    await webBattles.connect(addr1).createChallenge(challengeId, betAmount);
    console.log(`Addr1 created a challenge with ID ${challengeId} and bet amount ${ethers.formatUnits(betAmount, 18)} tokens`);
  
    // Check contract balance and challenge details after creation
    console.log(`Contract balance after challenge creation: ${ethers.formatUnits(await dotmoovsToken.balanceOf(webBattles.target), 18)} tokens`);
    let challenge = await webBattles.challenges(challengeId);
    console.log(`Challenge after creation:`, {
        owner: challenge.owner,
        challenged: challenge.challenged,
        betAmount: ethers.formatUnits(challenge.betAmount, 18),
        ownerVideoUrl: challenge.ownerVideoUrl,
        challengedVideoUrl: challenge.challengedVideoUrl
    });

    // Step 2: addr2 Accepts the Challenge
    await dotmoovsToken.connect(addr2).approve(webBattles.target, betAmount);
    await webBattles.connect(addr2).acceptChallenge(challengeId);
    console.log(`Addr2 accepted the challenge with ID ${challengeId} and matched the bet amount`);
  
    // Check balances and challenge details after acceptance
    console.log(`Contract balance after challenge acceptance: ${ethers.formatUnits(await dotmoovsToken.balanceOf(webBattles.target), 18)} tokens`);
    challenge = await webBattles.challenges(challengeId);
    console.log(`Challenge after acceptance:`, {
        owner: challenge.owner,
        challenged: challenge.challenged,
        betAmount: ethers.formatUnits(challenge.betAmount, 18),
        ownerVideoUrl: challenge.ownerVideoUrl,
        challengedVideoUrl: challenge.challengedVideoUrl
    });

    // Balances after challenge is accepted
    console.log(`Balances after accepting challenge:`);
    console.log(`Addr1: ${ethers.formatUnits(await dotmoovsToken.balanceOf(addr1.address), 18)} tokens`);
    console.log(`Addr2: ${ethers.formatUnits(await dotmoovsToken.balanceOf(addr2.address), 18)} tokens`);
  
    // Step 3: Assign the Winner (addr1 wins in this case)
    const isOwnerWinner = true;
    const ownerVideoUrl = "https://example.com/owner-video";
    const challengedVideoUrl = "https://example.com/challenged-video";
    const expectedWinningAmount = betAmount * 2n;
  
    console.log(`Assigning winner with expected winnings of ${ethers.formatUnits(expectedWinningAmount, 18)} tokens`);
  
    await webBattles.assignChallengeWinner(challengeId, isOwnerWinner, ownerVideoUrl, challengedVideoUrl);

    // Check balances and challenge details after assigning winner
    console.log(`Contract balance after winner assigned: ${ethers.formatUnits(await dotmoovsToken.balanceOf(webBattles.target), 18)} tokens`);
    challenge = await webBattles.challenges(challengeId);
    console.log(`Challenge after assigning winner:`, {
        owner: challenge.owner,
        challenged: challenge.challenged,
        betAmount: ethers.formatUnits(challenge.betAmount, 18),
        ownerVideoUrl: challenge.ownerVideoUrl,
        challengedVideoUrl: challenge.challengedVideoUrl
    });

    // Verify final balances after winnings distributed
    const balanceAddr1 = await dotmoovsToken.balanceOf(addr1.address);  // addr1 receives winnings
    const balanceAddr2 = await dotmoovsToken.balanceOf(addr2.address);  // addr2 balance remains as is
  
    console.log(`Final balances after challenge is resolved:`);
    console.log(`Addr1: ${ethers.formatUnits(balanceAddr1, 18)} tokens`);
    console.log(`Addr2: ${ethers.formatUnits(balanceAddr2, 18)} tokens`);
  
    expect(balanceAddr1).to.equal(initialAmount + betAmount);  // addr1's initial balance + winnings
    expect(balanceAddr2).to.equal(initialAmount - betAmount);   // addr2 lost, so no change from expected
  });
  
});