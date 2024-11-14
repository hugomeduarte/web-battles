const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("WebBattlesModule", (m) => {
  const dotmoovsTokenAddress = "0x972e2C1aD1ca2115d8aC32d352Dd6c4d3b24F9C3"; // The address of the Dotmoovs (MOOV) token deployed on the Sepolia testnet

  const webBattles = m.contract("WebBattles", [dotmoovsTokenAddress]);

  return { webBattles };
});