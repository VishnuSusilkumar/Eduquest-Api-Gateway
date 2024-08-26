import { Channel, Connection, connect } from "amqplib";
import rabbitmqConfig from "../../../config/rabbitmq.config";
import Producer from "./producer";
import { EventEmitter } from "events";
import Consumer from "./consumer";

class RabbitMQClient {
  private constructor() {}

  private static instance: RabbitMQClient;
  private isInitialized = false;

  private producer: Producer | undefined;
  private consumer: Consumer | undefined;
  private connection: Connection | undefined;
  private producerChannel: Channel | undefined;
  private consumerChannel: Channel | undefined;
  private eventEmitter: EventEmitter | undefined;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RabbitMQClient();
    }
    return this.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    try {
      this.connection = await connect(rabbitmqConfig.rabbitMQ.url);
      this.producerChannel = await this.connection.createChannel();
      this.consumerChannel = await this.connection.createChannel();
      const { queue: replyQueueName } = await this.consumerChannel.assertQueue(
        "",
        { exclusive: true }
      );
      this.eventEmitter = new EventEmitter();
      this.producer = new Producer(
        this.producerChannel,
        replyQueueName,
        this.eventEmitter
      );
      this.consumer = new Consumer(
        this.consumerChannel,
        replyQueueName,
        this.eventEmitter
      );

      this.consumer?.consumeMessages();
      this.isInitialized = true;
    } catch (e: any) {
      throw new Error("RabbitMQ Error");
    }
  }
  async produce(data: any, operation: string) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return await this.producer?.produceMessages(data, operation);
  }
}

export default RabbitMQClient.getInstance();
