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
adminRoute.post("/add-faq", isValidated, controller.addFAQ);
adminRoute.get("/get-faq", controller.getFAQ);
adminRoute.get("/get-instuctor-data/:id", controller.getInstructorData);
adminRoute.patch("/verify-user/:id", isValidated, controller.verifyUser);
adminRoute.patch("/block-user/:id", isValidated, controller.blockUser);
adminRoute.patch("/un-block-user/:id", isValidated, controller.unBlockUser);
adminRoute.get("/get-instructor-courses", isValidated, controller.getInstructorCourses);
adminRoute.patch("/block-course/:id", isValidated, controller.blockCourse);
adminRoute.patch("/un-block-course/:id", isValidated, controller.unBlockCourse);


export default adminRoute;
