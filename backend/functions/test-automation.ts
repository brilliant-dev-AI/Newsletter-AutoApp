import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AutomationFramework, SkyvernFramework, BrowserbaseFramework, PlaywrightFramework } from '../../lib/automation';
import { EmailService } from '../../lib/email-service';

interface TestResult {
  framework: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const url = event.queryStringParameters?.url || 'https://example.com';
    const testAll = event.queryStringParameters?.testAll === 'true';

    const emailService = new EmailService();
    const testEmail = await emailService.generateEmail();

    const frameworks: { name: string; framework: AutomationFramework }[] = [
      { name: 'Playwright', framework: new PlaywrightFramework() },
      { name: 'Skyvern', framework: new SkyvernFramework() },
      { name: 'Browserbase', framework: new BrowserbaseFramework() },
    ];

    const results: TestResult[] = [];

    for (const { name, framework } of frameworks) {
      const startTime = Date.now();
      
      try {
        console.log(`Testing ${name} framework with URL: ${url}`);
        const result = await framework.signUp(url, testEmail);
        const duration = Date.now() - startTime;

        results.push({
          framework: name,
          success: result.success,
          duration,
          error: result.error,
          details: result.details,
        });

        console.log(`${name} test completed:`, result);
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
          framework: name,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate statistics
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const fastestFramework = results.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        testResults: results,
        statistics: {
          totalTests,
          successfulTests,
          successRate: (successfulTests / totalTests) * 100,
          averageDuration: Math.round(averageDuration),
          fastestFramework: fastestFramework.framework,
        },
        recommendations: generateRecommendations(results),
      }),
    };

  } catch (error) {
    console.error('Test automation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function generateRecommendations(results: TestResult[]): string[] {
  const recommendations: string[] = [];
  
  const successfulFrameworks = results.filter(r => r.success);
  const fastestSuccessful = successfulFrameworks.reduce((fastest, current) => 
    current.duration < fastest.duration ? current : fastest
  );

  if (successfulFrameworks.length === 0) {
    recommendations.push('No frameworks succeeded. Check URL and form availability.');
  } else if (successfulFrameworks.length === 1) {
    recommendations.push(`Only ${successfulFrameworks[0].framework} succeeded. Use this framework for this site.`);
  } else {
    recommendations.push(`Multiple frameworks succeeded. ${fastestSuccessful.framework} was fastest (${fastestSuccessful.duration}ms).`);
  }

  // Check for specific patterns
  const playwrightResult = results.find(r => r.framework === 'Playwright');
  const skyvernResult = results.find(r => r.framework === 'Skyvern');
  const browserbaseResult = results.find(r => r.framework === 'Browserbase');

  if (playwrightResult?.success && !skyvernResult?.success) {
    recommendations.push('Playwright succeeded where Skyvern failed. This site may have simple forms.');
  }

  if (skyvernResult?.success && !playwrightResult?.success) {
    recommendations.push('Skyvern succeeded where Playwright failed. This site may have complex or dynamic forms.');
  }

  if (browserbaseResult?.success && !playwrightResult?.success) {
    recommendations.push('Browserbase succeeded where Playwright failed. This site may require cloud-based automation.');
  }

  return recommendations;
}
