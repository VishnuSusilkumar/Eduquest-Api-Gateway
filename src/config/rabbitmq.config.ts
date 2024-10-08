import "dotenv/config";

export default {
  rabbitMQ: {
    url: String(process.env.RabbitMQ_Link),
    queues: {
      userQueue: "user_queue",
      authQueue: "auth_queue",
      instructorQueue: "instructor_queue",
      notificationQueue: "notification_queue",
      adminQueue: "admin_queue",
      courseQueue: "course_queue",
      orderQueue: "order_queue",
    },
  },
};
