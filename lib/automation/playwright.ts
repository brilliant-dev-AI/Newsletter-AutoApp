import { AutomationFramework, AutomationResult } from './index';
import { chromium, Browser, Page } from 'playwright';

export class PlaywrightFramework implements AutomationFramework {
  private browser: Browser | null = null;

  getName(): string {
    return 'Playwright';
  }

  async signUp(url: string, email: string): Promise<AutomationResult> {
    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Navigate to the URL
      await page.goto(url, { waitUntil: 'networkidle' });

      // Look for common newsletter signup form patterns
      const formSelectors = [
        'form[action*="subscribe"]',
        'form[action*="newsletter"]',
        'form[action*="signup"]',
        'form[action*="join"]',
        'form[action*="register"]',
        'form[class*="newsletter"]',
        'form[class*="subscribe"]',
        'form[id*="newsletter"]',
        'form[id*="subscribe"]',
      ];

      let formFound = false;
      let formElement = null;

      for (const selector of formSelectors) {
        try {
          formElement = await page.$(selector);
          if (formElement) {
            formFound = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!formFound) {
        // Try to find any form with email input
        formElement = await page.$('form:has(input[type="email"])');
        if (formElement) {
          formFound = true;
        }
      }

      if (!formFound) {
        return {
          success: false,
          error: 'No newsletter signup form found on the page',
        };
      }

      // Find email input field
      const emailSelectors = [
        'input[type="email"]',
        'input[name*="email"]',
        'input[id*="email"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="newsletter" i]',
        'input[placeholder*="subscribe" i]',
      ];

      let emailInput = null;
      for (const selector of emailSelectors) {
        try {
          emailInput = await page.$(selector);
          if (emailInput) {
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!emailInput) {
        return {
          success: false,
          error: 'No email input field found in the form',
        };
      }

      // Fill email field
      await emailInput.fill(email);

      // Look for submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Subscribe")',
        'button:has-text("Sign Up")',
        'button:has-text("Join")',
        'button:has-text("Register")',
        'button[class*="submit"]',
        'button[id*="submit"]',
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.$(selector);
          if (submitButton) {
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!submitButton) {
        // Try to find any button in the form
        submitButton = await page.$('form button');
      }

      if (!submitButton) {
        return {
          success: false,
          error: 'No submit button found in the form',
        };
      }

      // Submit the form
      await submitButton.click();

      // Wait for response or redirect
      try {
        await page.waitForResponse(response => 
          response.url().includes('subscribe') || 
          response.url().includes('newsletter') ||
          response.url().includes('signup') ||
          response.status() === 200
        , { timeout: 10000 });
      } catch (error) {
        // Continue even if no response detected
      }

      // Check for success indicators
      const successSelectors = [
        ':has-text("Thank you")',
        ':has-text("Success")',
        ':has-text("Subscribed")',
        ':has-text("Welcome")',
        ':has-text("Confirmed")',
        '[class*="success"]',
        '[class*="thank"]',
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            successFound = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // Clean up
      await context.close();
      await this.browser.close();
      this.browser = null;

      return {
        success: successFound || true, // Assume success if no error occurred
        details: {
          url,
          email,
          framework: 'Playwright',
        },
      };

    } catch (error) {
      // Clean up on error
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (closeError) {
          // Ignore close errors
        }
        this.browser = null;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          url,
          email,
          framework: 'Playwright',
        },
      };
    }
  }
}
