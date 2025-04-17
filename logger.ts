/**
 * Logger utility for the Content Guardian system
 * Provides centralized logging functionality with different log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  moduleId?: string;
  message: string;
  data?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private logToConsole: boolean = true;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogToConsole(value: boolean): void {
    this.logToConsole = value;
  }

  public debug(moduleId: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, moduleId, message, data);
  }

  public info(moduleId: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, moduleId, message, data);
  }

  public warning(moduleId: string, message: string, data?: any): void {
    this.log(LogLevel.WARNING, moduleId, message, data);
  }

  public error(moduleId: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, moduleId, message, data);
  }

  private log(level: LogLevel, moduleId: string, message: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      moduleId,
      message,
      data
    };

    this.logs.push(logEntry);

    if (this.logToConsole) {
      const logPrefix = `[${logEntry.timestamp}] [${level}] [${moduleId}]`;
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`${logPrefix} ${message}`, data || '');
          break;
        case LogLevel.INFO:
          console.info(`${logPrefix} ${message}`, data || '');
          break;
        case LogLevel.WARNING:
          console.warn(`${logPrefix} ${message}`, data || '');
          break;
        case LogLevel.ERROR:
          console.error(`${logPrefix} ${message}`, data || '');
          break;
      }
    }
  }

  public getLogs(level?: LogLevel, moduleId?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (moduleId && log.moduleId !== moduleId) return false;
      return true;
    });
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
