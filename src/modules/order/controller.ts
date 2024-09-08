import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import orderRabbitMQClient from "./rabbitmq/client";
import courseRabbitMQClient from "../course/rabbitmq/client";
import "dotenv/config";
import { StatusCode } from "../../interfaces/enums";
import userRabbitMQClient from "../user/rabbitMQ/client";

export default class orderController {
  sendPublishKey = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "stripe-publishkey";
      const response: any = await orderRabbitMQClient.produce(null, operation);

      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      console.log(e);
      next(e);
    }
  };

  newPayment = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const amount = req.body.amount;
      const operation = "payment-intent";
      const response: any = await orderRabbitMQClient.produce(
        amount,
        operation
      );
      res.status(StatusCode.Created).json(response);
    } catch (e: any) {
      next(e);
    }
  };

  createOrder = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { courseId, payment_info } = req.body;
      const userId = req?.userId;

      const userResponse: any = await userRabbitMQClient.produce(
        { id: userId },
        "getUser"
      );
      const result = JSON.parse(userResponse.content.toString());
      console.log("Result", result);

      if (!result) {
        res
          .status(StatusCode.NotFound)
          .json({ success: false, message: "User not found" });
        return;
      }

      const courseExistInUser = result?.courses?.some(
        (id: any) => id === courseId
      );
      if (courseExistInUser) {
        res
          .status(StatusCode.Conflict)
          .json({ success: false, message: "already purchased course" });
        return;
      }

      const data = {
        courseId,
        payment_info,
        userId,
      };
      const operation = "create-order";
      const response: any = await orderRabbitMQClient.produce(data, operation);
      const updateCourseResponse: any = await userRabbitMQClient.produce(
        { userId, courseId },
        "update-course-list"
      );
      const resultUpdateCourse = JSON.parse(
        updateCourseResponse.content.toString()
      );
      if (!resultUpdateCourse.success) {
        res
          .status(StatusCode.BadGateway)
          .json({ success: false, message: "Bad Gateway" });
        return;
      }
      const courseResponse: any = await courseRabbitMQClient.produce(
        courseId,
        "update-purchase-count"
      );
      const resultCourse = JSON.parse(courseResponse.content.toString());
      res.status(StatusCode.Created).json(resultCourse);
    } catch (e: any) {
      next(e);
    }
  };
}
