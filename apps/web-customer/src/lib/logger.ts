type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  userId?: string;
  action?: string;
  path?: string;
  requestId?: string;
  durationMs?: number;
  eventId?: string;
  [key: string]: unknown;
};

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorInfo =
      error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { errorMessage: String(error) };

    console.error(formatLog("error", message, { ...errorInfo, ...context }));
  },
};
