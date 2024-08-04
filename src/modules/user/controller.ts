import { Request, Response, NextFunction } from "express";
import RabbitMQClient from "./rabbitMQ/client";
import AuthClient from "../auth/rabbitMQ/client";
import { generateTokenOptions } from "../../utils/generateTokenOptions";
import { CustomRequest } from "../interfaces/IRequest";
import { StatusCode } from "../../interfaces/enums";

export default class userController {
  register = async (req: Request, res: Response) => {
    try {
      const result = await RabbitMQClient.produce(req.body, "register");
      res.status(StatusCode.Created).json(result);
    } catch (err) {
      res
        .status(StatusCode.BadRequest)
        .json({ message: (err as Error).message });
    }
  };

  activate = async (req: Request, res: Response) => {
    try {
      const result = await RabbitMQClient.produce(req.body, "activateUser");
      res.status(StatusCode.Accepted).json(result);
    } catch (err) {
      res
        .status(StatusCode.BadRequest)
        .json({ message: (err as Error).message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result: any = await RabbitMQClient.produce(req.body, "login");

      if (!result || !result.accessToken || !result.refreshToken) {
        res
          .status(StatusCode.BadRequest)
          .json({ success: false, message: "Error logging in." });
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
        .json({ success: false, message: "Internal Server Error" });
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

      const authResult: any = await AuthClient.produce(
        { token },
        "isAuthenticated"
      );

      if (!authResult || !authResult.userId) {
        res.status(StatusCode.BadRequest).json({
          success: false,
          message: "User ID not found in authentication result.",
        });
        return;
      }

      const userResult: any = await RabbitMQClient.produce(
        { id: authResult.userId },
        "getUser"
      );

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
      const result: any = await RabbitMQClient.produce(
        { name, email, avatar },
        "socialAuth"
      );

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
      const result: any = await RabbitMQClient.produce(
        { userId, name },
        "updateUserInfo"
      );

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
      const result: any = await RabbitMQClient.produce(
        { oldPassword, newPassword, userId },
        "updatePassword"
      );

      res.status(StatusCode.Created).json(result);
    } catch (e: any) {
      next(e);
    }
  };
}
