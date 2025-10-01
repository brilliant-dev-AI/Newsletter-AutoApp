import OpenAI from 'openai';
import * as cheerio from 'cheerio';

export interface ExtractedLink {
  url: string;
  text: string;
  context: string;
  type: 'internal' | 'external' | 'social' | 'unsubscribe';
}

export class LinkExtractor {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract links from email content using multiple methods
   */
  async extractLinks(content: string): Promise<ExtractedLink[]> {
    try {
      // Method 1: Simple regex extraction
      const regexLinks = this.extractLinksWithRegex(content);
      
      // Method 2: HTML parsing with Cheerio
      const htmlLinks = this.extractLinksFromHTML(content);
      
      // Method 3: LLM-based extraction for better context
      const llmLinks = await this.extractLinksWithLLM(content);
      
      // Combine and deduplicate links
      const allLinks = [...regexLinks, ...htmlLinks, ...llmLinks];
      const uniqueLinks = this.deduplicateLinks(allLinks);
      
      return uniqueLinks;
    } catch (error) {
      console.error('Link extraction error:', error);
      // Fallback to simple regex extraction
      return this.extractLinksWithRegex(content);
    }
  }

  /**
   * Extract links using regex patterns
   */
  private extractLinksWithRegex(content: string): ExtractedLink[] {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    const matches = content.match(urlRegex) || [];
    
    return matches.map(url => ({
      url: url.trim(),
      text: this.extractLinkText(content, url),
      context: this.extractLinkContext(content, url),
      type: this.categorizeLink(url),
    }));
  }

  /**
   * Extract links from HTML content using Cheerio
   */
  private extractLinksFromHTML(htmlContent: string): ExtractedLink[] {
    try {
      const $ = cheerio.load(htmlContent);
      const links: ExtractedLink[] = [];
      
      $('a[href]').each((_, element) => {
        const $element = $(element);
        const href = $element.attr('href');
        const text = $element.text().trim();
        
        if (href && this.isValidUrl(href)) {
          links.push({
            url: this.normalizeUrl(href),
            text: text || 'No text',
            context: this.extractElementContext($element),
            type: this.categorizeLink(href),
          });
        }
      });
      
      return links;
    } catch (error) {
      console.error('HTML parsing error:', error);
      return [];
    }
  }

  /**
   * Extract links using LLM for better context understanding
   */
  private async extractLinksWithLLM(content: string): Promise<ExtractedLink[]> {
    try {
      if (!this.openai.apiKey) {
        return [];
      }

      const prompt = `
        Extract all links from this email content and provide context for each link.
        Return the result as a JSON array with the following structure:
        [
          {
            "url": "https://example.com",
            "text": "Link text or description",
            "context": "Surrounding text that provides context",
            "type": "internal|external|social|unsubscribe"
          }
        ]
        
        Email content:
        ${content.substring(0, 4000)} // Limit content to avoid token limits
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a link extraction assistant. Extract all URLs from the given content and provide context. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const extractedText = response.choices[0]?.message?.content;
      if (!extractedText) {
        return [];
      }

      // Parse JSON response
      const links = JSON.parse(extractedText);
      return Array.isArray(links) ? links : [];
    } catch (error) {
      console.error('LLM extraction error:', error);
      return [];
    }
  }

  /**
   * Deduplicate links based on URL
   */
  private deduplicateLinks(links: ExtractedLink[]): ExtractedLink[] {
    const seen = new Set<string>();
    return links.filter(link => {
      const normalizedUrl = this.normalizeUrl(link.url);
      if (seen.has(normalizedUrl)) {
        return false;
      }
      seen.add(normalizedUrl);
      return true;
    });
  }

  /**
   * Extract text associated with a link
   */
  private extractLinkText(content: string, url: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes(url)) {
        // Try to extract text before the URL
        const beforeUrl = line.substring(0, line.indexOf(url)).trim();
        if (beforeUrl) {
          return beforeUrl;
        }
        // Try to extract text after the URL
        const afterUrl = line.substring(line.indexOf(url) + url.length).trim();
        if (afterUrl) {
          return afterUrl;
        }
      }
    }
    return 'No text';
  }

  /**
   * Extract context around a link
   */
  private extractLinkContext(content: string, url: string): string {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(url)) {
        // Get surrounding lines for context
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        return lines.slice(start, end).join(' ').trim();
      }
    }
    return 'No context';
  }

  /**
   * Extract context from a Cheerio element
   */
  private extractElementContext($element: cheerio.Cheerio<cheerio.Element>): string {
    const parent = $element.parent();
    const siblings = parent.children();
    const context = siblings.map((_, el) => $(el).text()).get().join(' ').trim();
    return context || 'No context';
  }

  /**
   * Categorize a link based on its URL
   */
  private categorizeLink(url: string): 'internal' | 'external' | 'social' | 'unsubscribe' {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('unsubscribe') || lowerUrl.includes('opt-out')) {
      return 'unsubscribe';
    }
    
    if (lowerUrl.includes('facebook.com') || 
        lowerUrl.includes('twitter.com') || 
        lowerUrl.includes('linkedin.com') ||
        lowerUrl.includes('instagram.com') ||
        lowerUrl.includes('youtube.com')) {
      return 'social';
    }
    
    // This is a simplified categorization
    // In a real implementation, you'd have more sophisticated logic
    return 'external';
  }

  /**
   * Check if a URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      return url;
    }
  }
}
