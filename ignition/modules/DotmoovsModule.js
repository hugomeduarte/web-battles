const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DotmoovsModule", (m) => {
  const dotmoovs = m.contract("Dotmoovs");

  return { dotmoovs };
});
