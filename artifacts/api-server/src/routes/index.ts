import { Router, type IRouter } from "express";
import healthRouter from "./health";
import screeningRouter from "./screening";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(screeningRouter);
router.use(openaiRouter);

export default router;
