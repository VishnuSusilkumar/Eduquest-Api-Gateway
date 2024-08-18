import express, { Application } from "express";
import adminController from "./controller";
import { isValidated } from "../auth/controller";

const adminRoute: Application = express();
const controller = new adminController();

adminRoute.get("/get-users", isValidated, controller.getAllUsers);
adminRoute.get("/get-instructors", isValidated, controller.getAllInstructors);
adminRoute.delete("/delete-user/:id", isValidated, controller.deleteUser);
adminRoute.post("/add-categories", isValidated, controller.addCategories);
adminRoute.get("/get-categories", controller.getCategories);

export default adminRoute;
