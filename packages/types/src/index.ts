export type AppHealthStatus = "healthy" | "degraded" | "down";

export type { QueueColor } from "./queue-colors";
export {
  QUEUE_COLORS,
  getQueueColor,
  queueBoardFontClass,
  queueCustomerHeroClass,
} from "./queue-colors";
