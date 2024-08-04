import express, { Application } from "express";
import userController from "./controller";
import { isValidated } from "../auth/controller";

const userRoute: Application = express();

const controller = new userController();

userRoute.post("/register", controller.register);
userRoute.post("/activate", controller.activate);
userRoute.post("/login", controller.login);
userRoute.get("/me", controller.getUser);
userRoute.post("/social-auth", controller.socialAuth);
userRoute.get("/logout", controller.logout);
userRoute.post("/update-user-info", isValidated, controller.updateUserInfo);
userRoute.post(
  "/update-user-password",
  isValidated,
  controller.updateUserPassword
);

export default userRoute;
