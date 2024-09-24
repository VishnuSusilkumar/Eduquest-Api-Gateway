import express, { Application } from "express";
import { isValidated } from "../auth/controller";
import orderController from "./controller";

const orderRoute: Application = express();

const controller = new orderController();

orderRoute.get("/stripe-publishkey", controller.sendPublishKey);
orderRoute.post("/payment", controller.newPayment);
orderRoute.post("/create-order", isValidated, controller.createOrder);
orderRoute.get(
  "/get-orders-analytics/:id",
  isValidated,
  controller.getOrdersAnalytics
);
orderRoute.get(
  "/revenue-analytics/:id",
  isValidated,
  controller.getRevenueAnalytics
);
orderRoute.get(
  "/instructor-revenue-analytics/:id",
  isValidated,
  controller.getInstructorRevenueAnalytics
);

export default orderRoute;
