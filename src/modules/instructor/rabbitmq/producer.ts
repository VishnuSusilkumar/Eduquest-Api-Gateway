import { Channel } from "amqplib";
import rabbitmqConfig from "../../../config/rabbitmq.config";
import { randomUUID } from "crypto";
import EventEmitter from "events";

export default class Producer {
  constructor(
    private channel: Channel,
    private replyQueueName: string,
    private eventEmitter: EventEmitter
  ) {}

  async produceMessages(data: any, operation: string) {
    const uuid = randomUUID();
    this.channel.sendToQueue(
      rabbitmqConfig.rabbitMQ.queues.instructorQueue,
      Buffer.from(JSON.stringify(data)),
      {
        replyTo: this.replyQueueName,
        correlationId: uuid,
        expiration: 10,
        headers: {
          function: operation,
        },
      }
    );

    return new Promise((res, rej) => {
      this.eventEmitter.once(uuid, async (message) => {
        try {
          // Access the content of the message directly
          const reply = JSON.parse(message.content.toString());
          console.log("Reply received:", reply);
          res(reply);
        } catch (err) {
          console.error("Error processing message:", err);
          rej(new Error("Failed to process reply message"));
        }
      });
    });
  }
}
