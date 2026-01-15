import './module-alias-config';

if (process.env.NODE_ENV !== 'production') {
  require('@dotenvx/dotenvx').config({ path: '.env' });
}

import { AppDataSourceRead, AppDataSourceReadWrite } from "@mgmt-api/orm/db";
import { startApp } from "./app";

let serverInstance: import('http').Server | null = null;

const shutdown = async (signal?: string) => {
  try {
    console.log(`Shutdown initiated${signal ? ` due to ${signal}` : ''}`);
    if (serverInstance) {
      await new Promise<void>((resolve, reject) => {
        serverInstance!.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('HTTP server closed');
    }
    try {
      await AppDataSourceRead.destroy();
      await AppDataSourceReadWrite.destroy();
      console.log('Database connections closed');
    } catch (err) {
      console.error('Error closing DB connections during shutdown:', err);
    }
  } catch (err) {
    console.error('Error during shutdown:', err);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

(async () => {
  try {
    console.log("Connecting to the management database");
    await AppDataSourceRead.initialize();
    await AppDataSourceReadWrite.initialize();
    console.log("Connected to the management database");

    const maybeServer = await startApp();
    if (maybeServer) serverInstance = maybeServer;
  } catch (error) {
    console.error("Error during application startup:", error);
    process.exit(1);
  }
})();
