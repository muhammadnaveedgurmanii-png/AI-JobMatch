import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import resumeRouter from "./resume";
import resumeUploadRouter from "./resumeUpload";
import jobsRouter from "./jobs";
import matchesRouter from "./matches";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

// Public — health check only
router.use(healthRouter);

// Authenticated routes
router.use(profileRouter);
router.use(resumeRouter);
router.use(resumeUploadRouter);
router.use(jobsRouter);
router.use(matchesRouter);
router.use(dashboardRouter);

export default router;
