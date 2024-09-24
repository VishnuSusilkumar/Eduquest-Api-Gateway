import { Request, Response, NextFunction } from "express";
import RabbitMQClient from "./rabbitMQ/client";
import AuthClient from "../auth/rabbitMQ/client";
import { generateTokenOptions } from "../../utils/generateTokenOptions";
import { CustomRequest } from "../interfaces/IRequest";
import { StatusCode } from "../../interfaces/enums";
import NotificationClient from "../notification/rabbitmq/client";

export default class userController {
  register = async (req: Request, res: Response) => {
    try {
      const response: any = await RabbitMQClient.produce(req.body, "register");
      const result = JSON.parse(response.content.toString());

      console.log(result);

      if (!result.success) {
        res
          .status(StatusCode.BadRequest)
          .json({ success: false, message: result.message });
        return;
      }
      res.status(StatusCode.Created).json(result);
    } catch (err) {
      res
        .status(StatusCode.BadRequest)
        .json({ message: (err as Error).message });
    }
  };

  activate = async (req: Request, res: Response) => {
    try {
      const response: any = await RabbitMQClient.produce(
        req.body,
        "activateUser"
      );
      const result = JSON.parse(response.content.toString());
      if (!result.success) {
        res
          .status(StatusCode.BadRequest)
          .json({ success: false, message: result.message });
        return;
      }

      return res.status(StatusCode.Accepted).json(result);
    } catch (err) {
      res
        .status(StatusCode.BadRequest)
        .json({ message: (err as Error).message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const response: any = await RabbitMQClient.produce(req.body, "login");
      console.log("login details", req.body);

      const result = JSON.parse(response.content.toString());

      if (!result || !result.accessToken || !result.refreshToken) {
        res
          .status(StatusCode.BadRequest)
          .json({ success: false, message: result.message });
        return;
      }

      const options = generateTokenOptions();
      res.cookie(
        "refreshToken",
        result.refreshToken,
        options.refreshTokenOptions
      );
      res.cookie("accessToken", result.accessToken, options.accessTokenOptions);
      res.status(StatusCode.Accepted).json(result);
    } catch (error) {
      res
        .status(StatusCode.InternalServerError)
        .json({ success: false, message: error });
    }
  };

  logout = (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("accessToken", "", {
        maxAge: 1,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.cookie("refreshToken", "", {
        maxAge: 1,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      const cookies = req.cookies;
      for (const cookieName in cookies) {
        res.clearCookie(cookieName);
      }
      res
        .status(StatusCode.OK)
        .json({ success: true, message: "Logged out successfully" });
    } catch (e: any) {
      next(e);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.accessToken;

      if (!token) {
        res
          .status(StatusCode.Unauthorized)
          .json({ success: false, message: "No access token provided." });
        return;
      }

      const authResponse: any = await AuthClient.produce(
        { token },
        "isAuthenticated"
      );

      const authResult = JSON.parse(authResponse.content.toString());

      if (!authResult || !authResult.userId) {
        res.status(StatusCode.BadRequest).json({
          success: false,
          message: "User ID not found in authentication result.",
        });
        return;
      }

      const userResponse: any = await RabbitMQClient.produce(
        { id: authResult.userId },
        "getUser"
      );

      const userResult = JSON.parse(userResponse.content.toString());

      res.status(StatusCode.OK).json({ success: true, user: userResult });
    } catch (e: any) {
      res
        .status(StatusCode.InternalServerError)
        .json({ success: false, message: "Internal Server Error" });
    }
  };

  socialAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body;
      const response: any = await RabbitMQClient.produce(
        { name, email, avatar },
        "socialAuth"
      );

      const result = JSON.parse(response.content.toString());

      const options = generateTokenOptions();
      res.cookie(
        "refreshToken",
        result?.refreshToken,
        options.refreshTokenOptions
      );
      res.cookie(
        "accessToken",
        result?.accessToken,
        options.accessTokenOptions
      );
      res.status(StatusCode.Accepted).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  updateUserInfo = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { name } = req.body;
      const userId = req.userId;
      const response: any = await RabbitMQClient.produce(
        { userId, name },
        "updateUserInfo"
      );
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Created).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  updateUserPassword = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.userId;

      const response: any = await RabbitMQClient.produce(
        { oldPassword, newPassword, userId },
        "updateUserPassword"
      );
      const result = JSON.parse(response.content.toString());

      if (!result.success) {
        res
          .status(StatusCode.BadRequest)
          .json({ success: false, message: result.message });
        return;
      }

      return res.status(StatusCode.Created).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  updateUserAvatar = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;
      const id = req.userId;

      const response: any = await RabbitMQClient.produce(
        {
          data: file?.buffer,
          fieldname: file?.fieldname,
          mimetype: file?.mimetype,
          id,
        },
        "updateUserAvatar"
      );
      const result = JSON.parse(response.content.toString());
      console.log(result);

      if (result.success) {
        res.status(StatusCode.Created).json(result);
      } else {
        res.status(StatusCode.BadRequest).json({ message: "Bad Request" });
      }
    } catch (e: any) {
      next(e);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operation = "forgot-password";
      const response: any = await RabbitMQClient.produce(req.body, operation);
      const result = JSON.parse(response.content.toString());
      console.log(result);

      if (!result.success) {
        res
          .status(StatusCode.NotFound)
          .json({ success: false, message: result.message });
        return;
      }
      res.status(StatusCode.Created).json(result);
    } catch (error) {
      res
        .status(StatusCode.BadGateway)
        .json({ success: false, message: error });
    }
  };
  verifyResetCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operation = "verify-reset-code";
      const response: any = await RabbitMQClient.produce(req.body, operation);
      const result = JSON.parse(response.content.toString());

      if (!result.success) {
        res
          .status(StatusCode.BadRequest)
          .json({ success: false, message: result.message });
        return;
      }

      return res.status(StatusCode.Created).json(result);
    } catch (error) {
      res
        .status(StatusCode.BadGateway)
        .json({ success: false, message: error });
    }
  };
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operation = "reset-password";
      const response: any = await RabbitMQClient.produce(req.body, operation);
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.Created).json(result);
    } catch (error) {
      res
        .status(StatusCode.BadGateway)
        .json({ success: false, message: error });
    }
  };

  getUsersAnalytics = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const instructorId = req.params.id;
      const operation = "getUserAnalytics";
      const response: any = await RabbitMQClient.produce(
        instructorId,
        operation
      );
      const result = JSON.parse(response.content.toString());
      res.status(StatusCode.OK).json(result);
    } catch (e: any) {
      next(e);
    }
  };

  reportCourse = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const getAdminOperation = "get-user-by-role";
      const data = req.body;
      const getAdminResponse: any = await RabbitMQClient.produce(
        { role: "admin" },
        getAdminOperation
      );
      const getAdminResult = JSON.parse(getAdminResponse.content.toString());
      const adminIds = getAdminResult.data.map((admin: any) => admin._id);

      if (adminIds.length === 0) {
        return res.status(StatusCode.NotFound).json({
          success: false,
          message: "No admins found",
        });
      }

      const notificationOperation = "create-notification";
      const notificationPromises = adminIds.map((adminId: any) => {
        const notificationData = {
          title: "Course Reported",
          status: "unread",
          message: `The course "${data.courseName}" has been reported for: ${data.reason}`,
          instructorId: adminId,
        };

        return NotificationClient.produce(
          notificationData,
          notificationOperation
        );
      });

      const responses = await Promise.all(notificationPromises);
      const results = responses.map((response: any) =>
        JSON.parse(response.content.toString())
      );

      res.status(StatusCode.OK).json({
        success: true,
        message:
          "The course has been successfully reported. We will review the report and take appropriate action.",
      });
    } catch (e: any) {
      next(e);
    }
  };
}
