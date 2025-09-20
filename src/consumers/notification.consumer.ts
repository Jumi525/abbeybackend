import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import client from "../utils/prisma";

dotenv.config();

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const clientId = (process.env.KAFKA_CLIENT_ID || "social-app") + "-consumer";
const topic = process.env.NOTIFICATION_TOPIC || "notifications";

const kafka = new Kafka({ clientId, brokers });
const consumer = kafka.consumer({ groupId: "notification-service" });

type NotifEvent = {
  type: string;
  actorId: string;
  recipientId: string;
  postId?: string;
  meta?: any;
  createdAt?: string;
};

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  console.log(`Notification consumer subscribed to ${topic}`);

  setTimeout(async () => {
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;
          const payload: NotifEvent = JSON.parse(message.value.toString());
          console.log("Consumed notification event:", payload);

          await client.notification.create({
            data: {
              recipientId: payload.recipientId,
              senderId: payload.actorId,
              type: payload.type as any,
              postId: payload.postId || null,
              seen: false,
              createdAt: payload.createdAt
                ? new Date(payload.createdAt)
                : new Date(),
            },
          });
        } catch (err: any) {
          if (err.code === "P2002") {
            console.warn("Duplicate notification skipped.");
          } else {
            console.error("Error processing notification message:", err);
          }
        }
      },
    });
  }, 10000);
};

run().catch((err) => {
  console.error("Notification consumer failed", err);
  process.exit(1);
});
