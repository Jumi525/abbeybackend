"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishEvent = exports.getProducer = void 0;
const kafkajs_1 = require("kafkajs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const clientId = process.env.KAFKA_CLIENT_ID || "social-app";
const kafka = new kafkajs_1.Kafka({ clientId, brokers });
let producer = null;
const getProducer = async () => {
    if (producer)
        return producer;
    producer = kafka.producer();
    await producer.connect();
    return producer;
};
exports.getProducer = getProducer;
const publishEvent = async (topic, event) => {
    const pr = await (0, exports.getProducer)();
    await pr.send({
        topic,
        messages: [
            {
                key: event && event.type
                    ? String(event.type)
                    : undefined,
                value: JSON.stringify(event),
            },
        ],
    });
};
exports.publishEvent = publishEvent;
