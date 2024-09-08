import http from "http";
import { Server as SocketIoServer } from "socket.io";
import userRabbitMQClient from "../modules/user/rabbitMQ/client";
import "dotenv/config";
interface UsersInStream {
  [callid: string]: string[];
}

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIoServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const usersInStream: UsersInStream = {}; 

  io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("userJoinedStream", (data) => {
      const { name, callid } = data;
      if (!usersInStream[callid]) {
        usersInStream[callid] = [];
      }
      if (!usersInStream[callid].includes(name)) {
        usersInStream[callid].push(name);
      }
      io.emit("updateStreamParticipants", { callid, users: usersInStream[callid] });
    });

    socket.on("startStream", async (data) => {
      try {
        console.log("Start streaming data", data);
        const userResponse: any = await userRabbitMQClient.produce(
          { id: data.instructorId },
          "getUser"
        );
        const userResult = JSON.parse(userResponse.content.toString());
        console.log(userResult);
        io.emit("joinStream", {
          courses: userResult?.courses,
          streamId: data.callid,
        });
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        socket.emit("error", "Failed to start stream due to server error.");
      }
    });

    socket.on("endStream", (data) => {
      io.emit("streamEnded", { streamId: data.callid });
      delete usersInStream[data.callid];
    });

    socket.on("sendMessage", (datas) => {
      io.emit("recieveMessage", datas);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
