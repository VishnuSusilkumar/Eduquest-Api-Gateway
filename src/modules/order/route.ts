import express, { Application } from "express";
import { isValidated } from "../auth/controller";
import orderController from "./controller";

const orderRoute: Application = express();

const controller = new orderController();

orderRoute.get("/stripe-publishkey", controller.sendPublishKey);
orderRoute.post("/payment", controller.newPayment);
orderRoute.post("/create-order", isValidated, controller.createOrder);

export default orderRoute;
