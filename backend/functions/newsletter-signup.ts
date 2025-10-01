import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { AutomationFramework, SkyvernFramework, BrowserbaseFramework, PlaywrightFramework } from '../../lib/automation';
import { EmailService } from '../../lib/email-service';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const signupSchema = z.object({
  url: z.string().url(),
  framework: z.enum(['skyvern', 'browserbase', 'playwright']).optional().default('playwright'),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { url, framework } = signupSchema.parse(body);

    // Generate unique email for this subscription
    const emailService = new EmailService();
    const email = await emailService.generateEmail();

    // Initialize automation framework
    let automationFramework: AutomationFramework;
    switch (framework) {
      case 'skyvern':
        automationFramework = new SkyvernFramework();
        break;
      case 'browserbase':
        automationFramework = new BrowserbaseFramework();
        break;
      case 'playwright':
        automationFramework = new PlaywrightFramework();
        break;
      default:
        automationFramework = new PlaywrightFramework();
    }

    // Attempt newsletter signup
    const signupResult = await automationFramework.signUp(url, email);

    if (!signupResult.success) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Failed to sign up for newsletter',
          details: signupResult.error,
        }),
      };
    }

    // Store subscription in database
    const subscriptionId = uuidv4();
    const timestamp = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        pk: `SUBSCRIPTION#${subscriptionId}`,
        sk: `METADATA`,
        email,
        url,
        status: 'ACTIVE',
        framework,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        subscriptionId,
        email,
        url,
        framework,
        message: 'Successfully signed up for newsletter',
      }),
    };

  } catch (error) {
    console.error('Newsletter signup error:', error);
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
