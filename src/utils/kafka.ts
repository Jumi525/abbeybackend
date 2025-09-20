import { Kafka, Producer } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const clientId = process.env.KAFKA_CLIENT_ID || "social-app";

const kafka = new Kafka({ clientId, brokers });

let producer: Producer | null = null;

export const getProducer = async (): Promise<Producer> => {
  if (producer) return producer;
  producer = kafka.producer();
  await producer.connect();
  return producer;
};

export const publishEvent = async (topic: string, event: object) => {
  const pr = await getProducer();
  await pr.send({
    topic,
    messages: [
      {
        key:
          event && (event as any).type
            ? String((event as any).type)
            : undefined,
        value: JSON.stringify(event),
      },
    ],
  });
};
