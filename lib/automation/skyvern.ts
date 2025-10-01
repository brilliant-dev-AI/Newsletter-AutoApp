import { AutomationFramework, AutomationResult } from './index';

export class SkyvernFramework implements AutomationFramework {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SKYVERN_API_KEY || '';
    this.baseUrl = process.env.SKYVERN_BASE_URL || 'https://api.skyvern.com';
  }

  getName(): string {
    return 'Skyvern';
  }

  async signUp(url: string, email: string): Promise<AutomationResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Skyvern API key not configured',
        };
      }

      // Create a task for newsletter signup
      const taskData = {
        url,
        navigation_payload: {
          actions: [
            {
              action_type: 'fill',
              input: email,
              associated_selectors: [
                'input[type="email"]',
                'input[name*="email"]',
                'input[id*="email"]',
                'input[placeholder*="email" i]',
              ],
            },
            {
              action_type: 'click',
              associated_selectors: [
                'button[type="submit"]',
                'button:has-text("Subscribe")',
                'button:has-text("Sign Up")',
                'button:has-text("Join")',
                'input[type="submit"]',
              ],
            },
          ],
        },
        extracted_information_schema: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the newsletter signup was successful',
            },
            message: {
              type: 'string',
              description: 'Success or error message from the signup process',
            },
          },
        },
      };

      // Submit task to Skyvern
      const response = await fetch(`${this.baseUrl}/v1/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `Skyvern API error: ${errorData.message || response.statusText}`,
        };
      }

      const task = await response.json();
      const taskId = task.task_id;

      // Poll for task completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`${this.baseUrl}/v1/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          return {
            success: false,
            error: 'Failed to check task status',
          };
        }

        const taskStatus = await statusResponse.json();
        
        if (taskStatus.status === 'COMPLETED') {
          const extractedInfo = taskStatus.extracted_information;
          return {
            success: extractedInfo?.success || false,
            details: {
              taskId,
              extractedInfo,
              url,
              email,
              framework: 'Skyvern',
            },
          };
        } else if (taskStatus.status === 'FAILED') {
          return {
            success: false,
            error: `Task failed: ${taskStatus.failure_reason || 'Unknown error'}`,
            details: {
              taskId,
              url,
              email,
              framework: 'Skyvern',
            },
          };
        }

        attempts++;
      }

      return {
        success: false,
        error: 'Task timed out',
        details: {
          taskId,
          url,
          email,
          framework: 'Skyvern',
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          url,
          email,
          framework: 'Skyvern',
        },
      };
    }
  }
}
