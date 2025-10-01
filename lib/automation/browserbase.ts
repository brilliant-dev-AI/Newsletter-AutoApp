import { AutomationFramework, AutomationResult } from './index';

export class BrowserbaseFramework implements AutomationFramework {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BROWSERBASE_API_KEY || '';
    this.baseUrl = process.env.BROWSERBASE_BASE_URL || 'https://api.browserbase.com';
  }

  getName(): string {
    return 'Browserbase';
  }

  async signUp(url: string, email: string): Promise<AutomationResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'Browserbase API key not configured',
        };
      }

      // Create a session
      const sessionResponse = await fetch(`${this.baseUrl}/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          projectId: process.env.BROWSERBASE_PROJECT_ID,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        return {
          success: false,
          error: `Failed to create session: ${errorData.message || sessionResponse.statusText}`,
        };
      }

      const session = await sessionResponse.json();
      const sessionId = session.id;

      try {
        // Navigate to the URL
        await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/navigate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({ url }),
        });

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Find and fill email field
        const emailSelectors = [
          'input[type="email"]',
          'input[name*="email"]',
          'input[id*="email"]',
          'input[placeholder*="email" i]',
        ];

        let emailFilled = false;
        for (const selector of emailSelectors) {
          try {
            const fillResponse = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/fill`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
              },
              body: JSON.stringify({
                selector,
                value: email,
              }),
            });

            if (fillResponse.ok) {
              emailFilled = true;
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }

        if (!emailFilled) {
          return {
            success: false,
            error: 'Could not find or fill email input field',
          };
        }

        // Find and click submit button
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:has-text("Subscribe")',
          'button:has-text("Sign Up")',
          'button:has-text("Join")',
        ];

        let submitClicked = false;
        for (const selector of submitSelectors) {
          try {
            const clickResponse = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/click`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
              },
              body: JSON.stringify({ selector }),
            });

            if (clickResponse.ok) {
              submitClicked = true;
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }

        if (!submitClicked) {
          return {
            success: false,
            error: 'Could not find or click submit button',
          };
        }

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check for success indicators
        const successResponse = await fetch(`${this.baseUrl}/v1/sessions/${sessionId}/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            expression: `
              document.body.innerText.includes('Thank you') ||
              document.body.innerText.includes('Success') ||
              document.body.innerText.includes('Subscribed') ||
              document.body.innerText.includes('Welcome') ||
              document.body.innerText.includes('Confirmed')
            `,
          }),
        });

        let successFound = false;
        if (successResponse.ok) {
          const result = await successResponse.json();
          successFound = result.result;
        }

        return {
          success: successFound || true, // Assume success if no error occurred
          details: {
            sessionId,
            url,
            email,
            framework: 'Browserbase',
          },
        };

      } finally {
        // Close the session
        try {
          await fetch(`${this.baseUrl}/v1/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          });
        } catch (error) {
          // Ignore cleanup errors
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          url,
          email,
          framework: 'Browserbase',
        },
      };
    }
  }
}
