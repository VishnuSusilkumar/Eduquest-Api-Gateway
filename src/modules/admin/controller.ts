import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import AdminRabbitMQClient from "./rabbitmq/client";
import "dotenv/config";
import { StatusCode } from "../../interfaces/enums";
import { retryAndBreakerOperation } from "../../retry-handler";
import UserRabbitMQClient from "../user/rabbitMQ/client";
import InstructorRabbitMQClient from "../instructor/rabbitmq/client";

export interface S3Params {
  Bucket: string;
  Key: string;
  Body: Buffer | undefined;
  ContentType: string | undefined;
}

export default class AdminController {
  getAllUsers = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-all-users";
      const response: any = await retryAndBreakerOperation(() =>
        AdminRabbitMQClient.produce(null, operation)
      );
      res.status(StatusCode.OK).json(JSON.parse(response.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  getAllInstructors = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-all-instructors";
      const response: any = await AdminRabbitMQClient.produce(null, operation);
      const result = JSON.parse(response.content.toString());
      console.log("Result", result);

      res.status(StatusCode.OK).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  deleteUser = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "delete-user";
      const userId = req.params.id;
      const response: any = await AdminRabbitMQClient.produce(
        userId,
        operation
      );
      res.status(StatusCode.OK).json(JSON.parse(response.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  addCategories = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "add-categories";
      const categories = req.body;
      const response: any = await AdminRabbitMQClient.produce(
        categories,
        operation
      );
      res.status(StatusCode.OK).json(JSON.parse(response.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  getCategories = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-categories";
      const response: any = await AdminRabbitMQClient.produce(null, operation);
      res.status(StatusCode.OK).json(JSON.parse(response.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  addFAQ = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const operation = "add-faq";
      const questions = req.body;
      const response: any = await AdminRabbitMQClient.produce(
        questions,
        operation
      );
      res.status(StatusCode.OK).json(JSON.parse(response.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  getFAQ = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const operation = "get-faq";
      const response: any = await AdminRabbitMQClient.produce(null, operation);
      res.status(StatusCode.OK).json(JSON.parse(response.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  getInstructorData = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "getUser";
      const { id } = req.params;
      const response: any = await UserRabbitMQClient.produce(
        { id: id },
        operation
      );
      const user = JSON.parse(response.content.toString());
      console.log("userData", user);

      const instructorOperation = "get-instructor";

      const instructorResponse: any = await InstructorRabbitMQClient.produce(
        { id: id },
        instructorOperation
      );

      console.log("instructorData", user.name, instructorResponse);
      res.json({
        user,
        instructorResponse,
      });
    } catch (e: any) {
      next(e);
    }
  };

  verifyUser = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "verify-user";
      const { id } = req.params;
      const response: any = await UserRabbitMQClient.produce({ id }, operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Created).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  blockUser = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const operation = "block-user";
      const id = req.params.id;
      const response: any = await UserRabbitMQClient.produce({ id }, operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.OK).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  unBlockUser = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "un-block-user";
      const id = req.params.id;
      const response: any = await UserRabbitMQClient.produce({ id }, operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.OK).json(result);
    } catch (e: any) {
      next(e);
    }
  };
}
