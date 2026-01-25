import { NextRequest, NextResponse } from 'next/server';
import { SlackMessage } from '@/types';

interface SlackNotifyRequest {
  webhookUrl: string;
  message: SlackMessage;
}

export async function POST(request: NextRequest) {
  try {
    const body: SlackNotifyRequest = await request.json();
    const { webhookUrl, message } = body;

    // Validate webhook URL
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Validate that it's a Slack webhook URL
    if (!webhookUrl.startsWith('https://hooks.slack.com/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid Slack webhook URL' },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || !message.text) {
      return NextResponse.json(
        { success: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Send notification to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Slack API error: ${errorText}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
