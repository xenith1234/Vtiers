import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import playersRouter from "./players";
import gamemodesRouter from "./gamemodes";
import rankingsRouter from "./rankings";
import miscRouter from "./misc";
import botRouter from "./bot";
import applicationsRouter from "./applications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/players", playersRouter);
router.use("/gamemodes", gamemodesRouter);
router.use("/rankings", rankingsRouter);
router.use(botRouter);
router.use(applicationsRouter);
router.use(miscRouter);

export default router;
