import express, { Application } from "express";
import cors from "cors";
import userRoute from "./modules/user/route";
import authRoute from "./modules/auth/router";
import cookieParser from "cookie-parser";
import compression from "compression";
import logger from "morgan";
import http from "http";
import "dotenv/config";
import { credentials } from "amqplib";
import { initSocketServer } from "./utils/socket";
import instructorRoute from "./modules/instructor/route";
import adminRoute from "./modules/admin/route";
import courseRoute from "./modules/course/route";
import orderRoute from "./modules/order/route";

class App {
  public app: Application;
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    initSocketServer(this.server);
    this.applyMiddleware();
    this.routes();
  }

  private applyMiddleware(): void {
    this.app.use(express.json());
    console.log("Orgin", process.env.CORS_ORIGIN);
    
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );
    this.app.use(compression());
    this.app.use(logger("dev"));
    this.app.use(cookieParser());
  }

  private routes(): void {
    this.app.use("/api/user", userRoute);
    this.app.use("/api/auth", authRoute);
    this.app.use("/api/instructor", instructorRoute);
    this.app.use("/api/admin", adminRoute);
    this.app.use("/api/courses", courseRoute);
    this.app.use("/api/order", orderRoute);
  }

  public startServer(port: number): void {
    this.server.listen(port, () => {
      console.log(`API-Gateway started on ${port}`);
    });
  }
}

export default App;
