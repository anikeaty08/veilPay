import hre from "hardhat";
import { saveDeployment } from "./utils";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractFactory("VeilPayManager");
  const contract = await factory.connect(deployer).deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();

  const deploymentPath = saveDeployment(network, {
    VeilPayManager: address,
    deployer: deployer.address,
    chainId,
  });

  console.log("VeilPayManager deployed");
  console.log(`  network: ${network}`);
  console.log(`  chainId: ${chainId}`);
  console.log(`  address: ${address}`);
  console.log(`  deployment file: ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
