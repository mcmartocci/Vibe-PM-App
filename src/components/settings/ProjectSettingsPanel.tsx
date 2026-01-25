'use client';

import { useState } from 'react';
import { X, Settings, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SlackSettings } from './SlackSettings';

// Minimal project info needed for settings
interface ProjectSettingsInfo {
  id: string;
  name: string;
  color: string;
  staleThresholdHours: number;
  slackWebhookUrl?: string;
  slackNotificationsEnabled?: boolean;
}

interface ProjectSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectSettingsInfo;
  onUpdateProject: (id: string, updates: {
    stale_threshold_hours?: number;
    slack_webhook_url?: string;
    slack_notifications_enabled?: boolean;
  }) => Promise<void>;
}

export function ProjectSettingsPanel({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}: ProjectSettingsPanelProps) {
  const [staleThreshold, setStaleThreshold] = useState(
    project.staleThresholdHours ?? 48
  );
  const [slackEnabled, setSlackEnabled] = useState(
    project.slackNotificationsEnabled ?? false
  );
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(
    project.slackWebhookUrl ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProject(project.id, {
        stale_threshold_hours: staleThreshold,
        slack_webhook_url: slackWebhookUrl || undefined,
        slack_notifications_enabled: slackEnabled,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update project settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasStaleChanges = staleThreshold !== (project.staleThresholdHours ?? 48);
  const hasSlackChanges =
    slackEnabled !== (project.slackNotificationsEnabled ?? false) ||
    slackWebhookUrl !== (project.slackWebhookUrl ?? '');
  const hasChanges = hasStaleChanges || hasSlackChanges;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 bg-surface border border-line rounded-2xl shadow-2xl animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber/10">
              <Settings size={20} className="text-amber" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-text">
                Project Settings
              </h2>
              <p className="text-sm text-text-muted">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-elevated transition-all duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Stale Threshold Section */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
              <Clock size={16} />
              Stale Card Alerts
            </h3>

            <div className="space-y-4">
              {/* Description */}
              <p className="text-sm text-text-muted leading-relaxed">
                Cards that remain in the same column longer than the threshold will be
                marked as stale with a warning indicator. This helps identify tasks that
                may be stuck or need attention.
              </p>

              {/* Input */}
              <div className="flex items-center gap-4">
                <label
                  htmlFor="stale-threshold"
                  className="text-sm font-medium text-text"
                >
                  Stale threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="stale-threshold"
                    type="number"
                    min={1}
                    value={staleThreshold}
                    onChange={(e) => setStaleThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                    className={cn(
                      'w-20 px-3 py-2 rounded-lg',
                      'bg-elevated border border-line',
                      'text-text text-sm',
                      'focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30',
                      'transition-all duration-150'
                    )}
                  />
                  <span className="text-sm text-text-muted">hours</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {[24, 48, 72, 168].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setStaleThreshold(hours)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium',
                      'transition-all duration-150',
                      staleThreshold === hours
                        ? 'bg-amber/20 text-amber border border-amber/30'
                        : 'bg-elevated text-text-muted border border-line hover:border-text-muted'
                    )}
                  >
                    {hours === 24 && '1 day'}
                    {hours === 48 && '2 days'}
                    {hours === 72 && '3 days'}
                    {hours === 168 && '1 week'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-line-subtle" />

          {/* Slack Notifications Section */}
          <SlackSettings
            projectName={project.name}
            enabled={slackEnabled}
            webhookUrl={slackWebhookUrl}
            onEnabledChange={setSlackEnabled}
            onWebhookUrlChange={setSlackWebhookUrl}
          />

          {/* Divider */}
          <div className="h-px bg-line-subtle" />

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'text-sm font-medium',
                'transition-all duration-150',
                hasChanges && !isSaving
                  ? 'bg-amber text-background hover:bg-amber/90'
                  : 'bg-elevated text-text-muted cursor-not-allowed'
              )}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
