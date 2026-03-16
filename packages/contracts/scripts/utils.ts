import fs from "fs";
import path from "path";

const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");

export function ensureDeploymentsDir() {
  if (!fs.existsSync(DEPLOYMENTS_DIR)) {
    fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  }
}

export function saveDeployment(
  network: string,
  payload: Record<string, unknown>,
) {
  ensureDeploymentsDir();
  const deploymentPath = path.join(DEPLOYMENTS_DIR, `${network}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(payload, null, 2));
  return deploymentPath;
}

export function getDeployment(network: string) {
  const deploymentPath = path.join(DEPLOYMENTS_DIR, `${network}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found for network "${network}"`);
  }

  return JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as Record<
    string,
    string
  >;
}
