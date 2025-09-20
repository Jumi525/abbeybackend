"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kafkajs_1 = require("kafkajs");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("../utils/prisma"));
dotenv_1.default.config();
const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const clientId = (process.env.KAFKA_CLIENT_ID || "social-app") + "-consumer";
const topic = process.env.NOTIFICATION_TOPIC || "notifications";
const kafka = new kafkajs_1.Kafka({ clientId, brokers });
const consumer = kafka.consumer({ groupId: "notification-service" });
const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    console.log(`Notification consumer subscribed to ${topic}`);
    setTimeout(async () => {
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    if (!message.value)
                        return;
                    const payload = JSON.parse(message.value.toString());
                    console.log("Consumed notification event:", payload);
                    await prisma_1.default.notification.create({
                        data: {
                            recipientId: payload.recipientId,
                            senderId: payload.actorId,
                            type: payload.type,
                            postId: payload.postId || null,
                            seen: false,
                            createdAt: payload.createdAt
                                ? new Date(payload.createdAt)
                                : new Date(),
                        },
                    });
                }
                catch (err) {
                    if (err.code === "P2002") {
                        console.warn("Duplicate notification skipped.");
                    }
                    else {
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
