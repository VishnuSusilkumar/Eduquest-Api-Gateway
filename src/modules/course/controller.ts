import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import CourseRabbitMQClient from "./rabbitmq/client";
import crypto from "crypto";
import "dotenv/config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../config/s3.config";
import { StatusCode } from "../../interfaces/enums";
import UserRabbitMQClient from "../user/rabbitMQ/client";
import NotificationClient from "../notification/rabbitmq/client";

export interface S3Params {
  Bucket: string;
  Key: string;
  Body: Buffer | undefined;
  ContentType: string | undefined;
}

export default class CourseController {
  createCourse = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = req.body;
      const file = req.file;
      let url = "";
      if (file) {
        const randomName = (bytes = 32) =>
          crypto.randomBytes(bytes).toString("hex");
        const bucketName = process.env.S3_BUCKET_NAME || "";

        const imageName = `Eduquest-course-thumbnail/${randomName()}`;

        const params: S3Params = {
          Bucket: bucketName,
          Key: imageName,
          Body: file?.buffer,
          ContentType: file?.mimetype,
        };

        const command = new PutObjectCommand(params);
        await s3.send(command);
        url = `https://eduquest-elearning.s3.ap-south-1.amazonaws.com/${imageName}`;
      }
      body.benefits = JSON.parse(body.benefits);
      body.prerequisites = JSON.parse(body.prerequisites);
      body.courseContentData = JSON.parse(body.courseContentData);

      const operation = "create-course";
      const data = {
        instructorId: req.userId,
        ...body,
        thumbnail: url,
      };
      const response: any = await CourseRabbitMQClient.produce(data, operation);
      const result = JSON.parse(response.content.toString());
      const courseId = result._id;
      const userId = req.userId;

      const operation2 = "update-course-list";
      const updateCourseListData = { userId: userId, courseId: courseId };
      const updateCourseListResponse: any = await UserRabbitMQClient.produce(
        updateCourseListData,
        operation2
      );

      if (updateCourseListResponse) {
        res.status(StatusCode.Created).json({ success: true });
      }
    } catch (e: any) {
      next(e);
    }
  };

  getCourses = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-courses";
      const instructorId = req.userId;
      const message: any = await CourseRabbitMQClient.produce(
        instructorId,
        operation
      );
      res.status(StatusCode.OK).json(JSON.parse(message.content.toString()));
    } catch (e: any) {
      next(e);
    }
  };

  updateCourse = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const body = req.body;
      const file = req.file;
      let url;
      if (file) {
        const randomName = (bytes = 32) =>
          crypto.randomBytes(bytes).toString("hex");
        const bucketName = process.env.S3_BUCKET_NAME || "";
        const imageName = `Eduquest-course-thumbnail/${randomName()}`;

        const params: S3Params = {
          Bucket: bucketName,
          Key: imageName,
          Body: file?.buffer,
          ContentType: file?.mimetype,
        };

        const command = new PutObjectCommand(params);
        await s3.send(command);
        url = `https://eduquest-elearning.s3.ap-south-1.amazonaws.com/${imageName}`;
      }

      body.benefits = JSON.parse(body.benefits);
      body.prerequisites = JSON.parse(body.prerequisites);
      body.courseContentData = JSON.parse(body.courseContentData);
      const operation = "update-course";
      const data = {
        instructorId: req.userId,
        ...body,
        thumbnail: url,
      };

      const response: any = await CourseRabbitMQClient.produce(data, operation);
      res.status(StatusCode.Accepted).json(response);
    } catch (e: any) {
      next(e);
    }
  };

  deleteCourse = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseId = req.params.id;
      const operation = "delete-course";
      const response: any = await CourseRabbitMQClient.produce(
        courseId,
        operation
      );
      res.status(StatusCode.OK).json(response);
    } catch (e: any) {
      next(e);
    }
  };

  getSingleCourse = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseId = req.params.id;
      const operation = "get-course-wop";
      const response: any = await CourseRabbitMQClient.produce(
        courseId,
        operation
      );
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  getAllCourses = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-all-courses";
      const response: any = await CourseRabbitMQClient.produce(null, operation);
      const jsonData = JSON.parse(response.content.toString());
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  getTrendingCourses = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const operation = "get-trending-courses";
      const response: any = await CourseRabbitMQClient.produce(null, operation);
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  getCourseContent = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseId = req.params.id;
      const operation = "get-course-content";
      const response: any = await CourseRabbitMQClient.produce(
        courseId,
        operation
      );
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  addQuestion = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = req.body;
      const operation = "add-question";
      const response: any = await CourseRabbitMQClient.produce(data, operation);
      const resp = response.content.toString();
      const notificationOperation = "create-notification";
      const noticationData = {
        title: "New Question",
        status: "unread",
        message: `You have new question from ${data.questionList.user.courseName}`,
        instructorId: data.questionList.user.instructorId,
      };
      await NotificationClient.produce(noticationData, notificationOperation);
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  addAnswer = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const operation = "add-answer";
      const response: any = await CourseRabbitMQClient.produce(data, operation);
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  addReview = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      let data = req.body;
      data.userId = req.userId;
      console.log(data);
      const operation = "add-review";
      const response: any = await CourseRabbitMQClient.produce(data, operation);
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  getNotifications = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const instructorId = req.params.id;
      const operation = "get-all-notifications";
      const response: any = await NotificationClient.produce(
        instructorId,
        operation
      );
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  updateNotification = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const operation = "update-notification";
      const response: any = await NotificationClient.produce(id, operation);
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  searchCourses = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const searchTerm = req.query.term;
      const operation = "search-courses";
      const response: any = await CourseRabbitMQClient.produce(
        searchTerm,
        operation
      );
      const resp = response.content.toString();
      const jsonData = JSON.parse(resp);
      res.status(StatusCode.OK).json(jsonData);
    } catch (e: any) {
      next(e);
    }
  };

  getUserCourses = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId;
      const operation = "getUser";
      const response: any = await UserRabbitMQClient.produce(
        { id: userId },
        operation
      );
      const user = JSON.parse(response.content.toString());

      if (!user || !user.courses) {
        return res
          .status(StatusCode.NotFound)
          .json({ success: false, message: "User courses not found" });
      }

      const userIds = user.courses;
      const courseOperation = "get-user-courses";
      const courseResponse: any = await CourseRabbitMQClient.produce(
        userIds,
        courseOperation
      );
      const courseData = JSON.parse(courseResponse.content.toString());

      res.status(StatusCode.OK).json(courseData);
    } catch (e: any) {
      next(e);
    }
  };
}
