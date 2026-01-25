'use client';

import { useCallback } from 'react';
import { Task, SlackMessage, SlackBlock } from '@/types';

type SlackEvent = 'task_created' | 'status_changed' | 'task_archived' | 'test';

interface SlackNotificationResult {
  success: boolean;
  error?: string;
}

export function useSlackIntegration() {
  const sendSlackNotification = useCallback(
    async (webhookUrl: string, message: SlackMessage): Promise<SlackNotificationResult> => {
      try {
        const response = await fetch('/api/slack/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ webhookUrl, message }),
        });

        const result = await response.json();
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send notification',
        };
      }
    },
    []
  );

  const formatTaskCreatedMessage = useCallback(
    (task: Task, projectName: string): SlackMessage => {
      const priorityEmoji =
        task.priority === 'high' ? ':red_circle:' :
        task.priority === 'medium' ? ':large_orange_circle:' :
        ':large_green_circle:';

      const blocks: SlackBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:new: *New Task Created*\n*${task.title}*`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${priorityEmoji} Priority: ${task.priority} | Project: ${projectName}`,
            },
          ],
        },
      ];

      if (task.description) {
        blocks.splice(1, 0, {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: task.description,
          },
        });
      }

      return {
        text: `New task created: ${task.title} in ${projectName}`,
        blocks,
      };
    },
    []
  );

  const formatStatusChangedMessage = useCallback(
    (task: Task, fromStatus: string, toStatus: string, projectName: string): SlackMessage => {
      const blocks: SlackBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:arrow_right: *Task Status Changed*\n*${task.title}*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${fromStatus}* :arrow_right: *${toStatus}*`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Project: ${projectName}`,
            },
          ],
        },
      ];

      return {
        text: `Task "${task.title}" moved from ${fromStatus} to ${toStatus} in ${projectName}`,
        blocks,
      };
    },
    []
  );

  const formatTaskArchivedMessage = useCallback(
    (task: Task, projectName: string): SlackMessage => {
      const blocks: SlackBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:white_check_mark: *Task Completed & Archived*\n*${task.title}*`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Project: ${projectName}`,
            },
          ],
        },
      ];

      return {
        text: `Task "${task.title}" has been completed and archived in ${projectName}`,
        blocks,
      };
    },
    []
  );

  const formatTestMessage = useCallback(
    (projectName: string): SlackMessage => {
      const blocks: SlackBlock[] = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:wave: *Test Notification*\nSlack integration is working for *${projectName}*!`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'This is a test message from your Project Management app.',
            },
          ],
        },
      ];

      return {
        text: `Test notification from ${projectName}`,
        blocks,
      };
    },
    []
  );

  const sendTestNotification = useCallback(
    async (webhookUrl: string, projectName: string): Promise<SlackNotificationResult> => {
      const message = formatTestMessage(projectName);
      return sendSlackNotification(webhookUrl, message);
    },
    [sendSlackNotification, formatTestMessage]
  );

  const notifyTaskCreated = useCallback(
    async (webhookUrl: string, task: Task, projectName: string): Promise<SlackNotificationResult> => {
      const message = formatTaskCreatedMessage(task, projectName);
      return sendSlackNotification(webhookUrl, message);
    },
    [sendSlackNotification, formatTaskCreatedMessage]
  );

  const notifyStatusChanged = useCallback(
    async (
      webhookUrl: string,
      task: Task,
      fromStatus: string,
      toStatus: string,
      projectName: string
    ): Promise<SlackNotificationResult> => {
      const message = formatStatusChangedMessage(task, fromStatus, toStatus, projectName);
      return sendSlackNotification(webhookUrl, message);
    },
    [sendSlackNotification, formatStatusChangedMessage]
  );

  const notifyTaskArchived = useCallback(
    async (webhookUrl: string, task: Task, projectName: string): Promise<SlackNotificationResult> => {
      const message = formatTaskArchivedMessage(task, projectName);
      return sendSlackNotification(webhookUrl, message);
    },
    [sendSlackNotification, formatTaskArchivedMessage]
  );

  return {
    sendSlackNotification,
    formatTaskCreatedMessage,
    formatStatusChangedMessage,
    formatTaskArchivedMessage,
    formatTestMessage,
    sendTestNotification,
    notifyTaskCreated,
    notifyStatusChanged,
    notifyTaskArchived,
  };
}
