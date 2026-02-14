const hre = require("hardhat");

async function main() {
  console.log("Deploying RoastNFT to", hre.network.name, "...\n");

  const roastNFT = await hre.viem.deployContract("RoastNFT");

  console.log("RoastNFT deployed to:", roastNFT.address);
  console.log("\nUpdate your .env.local:");
  console.log(`  NEXT_PUBLIC_ROAST_NFT_ADDRESS=${roastNFT.address}`);
  console.log("\nVerify on BaseScan:");
  if (hre.network.name === "base") {
    console.log(`  https://basescan.org/address/${roastNFT.address}`);
  } else {
    console.log(`  https://sepolia.basescan.org/address/${roastNFT.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
