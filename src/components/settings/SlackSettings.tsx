'use client';

import { useState } from 'react';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSlackIntegration } from '@/hooks/useSlackIntegration';

interface SlackSettingsProps {
  projectName: string;
  enabled: boolean;
  webhookUrl: string;
  onEnabledChange: (enabled: boolean) => void;
  onWebhookUrlChange: (url: string) => void;
}

export function SlackSettings({
  projectName,
  enabled,
  webhookUrl,
  onEnabledChange,
  onWebhookUrlChange,
}: SlackSettingsProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { sendTestNotification } = useSlackIntegration();

  const handleTestNotification = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: 'Please enter a webhook URL first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await sendTestNotification(webhookUrl, projectName);

    if (result.success) {
      setTestResult({ success: true, message: 'Test notification sent successfully!' });
    } else {
      setTestResult({ success: false, message: result.error || 'Failed to send test notification' });
    }

    setIsTesting(false);

    // Clear result after 5 seconds
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
        <MessageSquare size={16} />
        Slack Notifications
      </h3>

      <div className="space-y-4">
        {/* Description */}
        <p className="text-sm text-text-muted leading-relaxed">
          Get notified in Slack when tasks are created, moved between columns, or archived.
          You will need a Slack webhook URL to enable this feature.
        </p>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="slack-enabled" className="text-sm font-medium text-text">
            Enable Slack notifications
          </label>
          <button
            id="slack-enabled"
            role="switch"
            aria-checked={enabled}
            onClick={() => onEnabledChange(!enabled)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors duration-200',
              enabled ? 'bg-amber' : 'bg-elevated border border-line'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm',
                enabled && 'translate-x-5'
              )}
            />
          </button>
        </div>

        {/* Webhook URL Input - only show when enabled */}
        {enabled && (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="slack-webhook-url"
                className="block text-sm font-medium text-text mb-2"
              >
                Webhook URL
              </label>
              <input
                id="slack-webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => onWebhookUrlChange(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-elevated border border-line',
                  'text-text text-sm',
                  'placeholder:text-text-muted',
                  'focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30',
                  'transition-all duration-150'
                )}
              />
              <p className="mt-1.5 text-xs text-text-muted">
                Create a webhook in your Slack workspace via the Slack API dashboard.
              </p>
            </div>

            {/* Test Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestNotification}
                disabled={isTesting || !webhookUrl}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'text-sm font-medium',
                  'transition-all duration-150',
                  webhookUrl && !isTesting
                    ? 'bg-elevated border border-line text-text hover:border-text-muted'
                    : 'bg-elevated border border-line text-text-muted cursor-not-allowed'
                )}
              >
                <Send size={14} />
                {isTesting ? 'Sending...' : 'Send Test'}
              </button>

              {/* Test Result */}
              {testResult && (
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-sm',
                    testResult.success ? 'text-sage' : 'text-coral'
                  )}
                >
                  {testResult.success ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
