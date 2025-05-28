import { Client } from '@upstash/qstash';

export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Helper functions for common QStash operations
export const qstashHelpers = {
  async publishJSON(
    url: string,
    data: any,
    options?: {
      delay?: number;
      retries?: number;
      callback?: string;
    }
  ): Promise<any> {
    return await qstashClient.publishJSON({
      url,
      body: data,
      delay: options?.delay,
      retries: options?.retries,
      callback: options?.callback,
    });
  },

  async scheduleMessage(
    url: string,
    cron: string,
    data: any
  ): Promise<any> {
    return await qstashClient.schedules.create({
      destination: url,
      cron,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    await qstashClient.schedules.delete(scheduleId);
  },

  async listSchedules(): Promise<any> {
    return await qstashClient.schedules.list();
  },
};