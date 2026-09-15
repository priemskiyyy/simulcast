import type { DeployStage } from "../schemas/deploySchema";

export const formatStage = (stage: DeployStage) => {
  const LABELS: Record<DeployStage, string> = {
    BUILDING: "Building",
    TESTING: "Testing",
    SHIPPING: "Shipping",
    LIVE: "Live",
  };

  return LABELS[stage];
};
