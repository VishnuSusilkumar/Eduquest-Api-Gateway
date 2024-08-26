import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/IRequest";
import InstructorRabbitMQClient from "./rabbitmq/client";
import "dotenv/config";
import { StatusCode } from "../../interfaces/enums";
import UserRabbitMQClient from "../user/rabbitMQ/client";

export default class instructorController {
  register = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      const file = req.file;
      const operation = "register-instructor";
      const data = {
        userId: req.userId,
        degree: body.degree.join(""),
        institution: body.institution,
        subject: body.subject,
        yearOfCompletion: body.yearOfCompletion,
        certificateName: body.certificateName,
        certificateDate: body.date,
        buffer: file?.buffer,
        fieldName: file?.fieldname,
        mimeType: file?.mimetype,
      };
      const response: any = await InstructorRabbitMQClient.produce(
        data,
        operation
      );

      const userRoleData = {
        userId: req.userId,
        newRole: "instructor",
      };

      const operation2 = "update-user-role";
      const roleUpdateResponse: any = await UserRabbitMQClient.produce(
        userRoleData,
        operation2
      );
      const result2 = JSON.parse(roleUpdateResponse.content.toString());

      console.log("Role change", result2);

      if (roleUpdateResponse) {
        res.status(StatusCode.Created).json({
          message: "Instructor registered and user role updated successfully",
          instructorResponse: response,
        });
      }
    } catch (e: any) {
      next(e);
    }
  };
}
