import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import profileRouter from "./profile.js";
import resumeRouter from "./resume.js";
import resumeUploadRouter from "./resumeUpload.js";
import jobsRouter from "./jobs.js";
import matchesRouter from "./matches.js";
import dashboardRouter from "./dashboard.js";

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
