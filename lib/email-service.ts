import { v4 as uuidv4 } from 'uuid';

export class EmailService {
  private emailDomain: string;

  constructor() {
    this.emailDomain = process.env.EMAIL_DOMAIN || 'newsletter-automation.com';
  }

  /**
   * Generate a unique email address for newsletter subscriptions
   */
  async generateEmail(): Promise<string> {
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    return `newsletter-${timestamp}-${randomId}@${this.emailDomain}`;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract domain from email
   */
  getDomain(email: string): string {
    return email.split('@')[1] || '';
  }

  /**
   * Generate a temporary email for testing
   */
  generateTempEmail(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    return `temp-${timestamp}-${randomId}@${this.emailDomain}`;
  }
}
