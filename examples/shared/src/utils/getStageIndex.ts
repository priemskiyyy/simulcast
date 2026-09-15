import { DEPLOY_STAGES } from "../schemas/deploySchema";
import type { DeployStage } from "../schemas/deploySchema";

export const getStageIndex = (stage: DeployStage) =>
  DEPLOY_STAGES.indexOf(stage);
