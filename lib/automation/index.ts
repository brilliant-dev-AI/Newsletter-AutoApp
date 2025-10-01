export interface AutomationResult {
  success: boolean;
  error?: string;
  details?: any;
}

export interface AutomationFramework {
  signUp(url: string, email: string): Promise<AutomationResult>;
  getName(): string;
}

export { SkyvernFramework } from './skyvern';
export { BrowserbaseFramework } from './browserbase';
export { PlaywrightFramework } from './playwright';
