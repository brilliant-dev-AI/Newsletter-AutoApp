import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LinkExtractor } from '../../lib/link-extractor';
import { EmailService } from '../../lib/email-service';
import { z } from 'zod';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const emailProcessSchema = z.object({
  email: z.string().email(),
  subject: z.string(),
  content: z.string(),
  from: z.string().optional(),
  receivedAt: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, subject, content, from, receivedAt } = emailProcessSchema.parse(body);

    // Initialize services
    const linkExtractor = new LinkExtractor();
    const emailService = new EmailService();

    // Extract links from email content
    const extractedLinks = await linkExtractor.extractLinks(content);

    if (extractedLinks.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          message: 'No links found in email',
          linksCount: 0,
        }),
      };
    }

    // Find the subscription for this email
    const subscriptionQuery = await docClient.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }));

    if (!subscriptionQuery.Items || subscriptionQuery.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Subscription not found for email',
        }),
      };
    }

    const subscription = subscriptionQuery.Items[0];
    const timestamp = new Date().toISOString();

    // Store extracted links
    const linkId = `LINK#${Date.now()}`;
    await docClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        pk: subscription.pk,
        sk: linkId,
        email,
        subject,
        from: from || 'unknown',
        links: JSON.stringify(extractedLinks),
        receivedAt: receivedAt || timestamp,
        processedAt: timestamp,
      },
    }));

    // Update subscription with latest activity
    await docClient.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        pk: subscription.pk,
        sk: subscription.sk,
      },
      UpdateExpression: 'SET updatedAt = :updatedAt, lastEmailReceived = :lastEmailReceived',
      ExpressionAttributeValues: {
        ':updatedAt': timestamp,
        ':lastEmailReceived': timestamp,
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
        message: 'Email processed successfully',
        linksCount: extractedLinks.length,
        links: extractedLinks,
        subscriptionId: subscription.pk.replace('SUBSCRIPTION#', ''),
      }),
    };

  } catch (error) {
    console.error('Email processing error:', error);
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
