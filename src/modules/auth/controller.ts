import { NextFunction, Request, Response } from "express";
import RabbitMQClient from "./rabbitMQ/client";
import UserRabbitMQClient from "../user/rabbitMQ/client";
import { CustomRequest } from "../interfaces/IRequest";
import AsyncHandler from "express-async-handler";
import { generateTokenOptions } from "../../utils/generateTokenOptions";
import { StatusCode } from "../../interfaces/enums";

export const isValidated = AsyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken; 
    try {
      const response: any = await RabbitMQClient.produce(
        { token },
        "isAuthenticated"
      );
      const result = JSON.parse(response.content.toString());

      if (!result || !result.userId) {
        res
          .status(StatusCode.Unauthorized)
          .json({ success: false, message: "Unauthorized" });
        return;
      }

      const operation = "getUser";
      const id = result.userId;
      const userResponse: any = await UserRabbitMQClient.produce(
        { id },
        operation
      );
      const user = JSON.parse(userResponse.content.toString());
      if (user.isBlocked) {
        
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

        res
          .status(StatusCode.Forbidden)
          .json({ success: false, message: "User is blocked and logged out!" });
        return;
      }
      req.userId = result.userId;
      req.role = result.role;
      next();
    } catch (err: any) {
      res
        .status(StatusCode.Unauthorized)
        .json({ success: false, message: err.message });
    }
  }
);

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(StatusCode.Unauthorized).json({ message: "Token is missing" });
    return;
  }

  try {
    const response: any = await RabbitMQClient.produce(
      { token },
      "refreshToken"
    );
    const result = JSON.parse(response.content.toString());

    if (!result || !result.accessToken || !result.refreshToken) {
      res
        .status(StatusCode.NotAcceptable)
        .json({ message: "Invalid refresh token" });
      return;
    }

    const options = generateTokenOptions();
    res.cookie("accessToken", result.accessToken, options.accessTokenOptions);
    res.cookie(
      "refreshToken",
      result.refreshToken,
      options.refreshTokenOptions
    );
    res
      .status(StatusCode.Created)
      .json({ success: true, message: "New token generated successfully" });
  } catch (err: any) {
    res
      .status(StatusCode.InternalServerError)
      .json({ message: "Internal Server Error" });
  }
};
