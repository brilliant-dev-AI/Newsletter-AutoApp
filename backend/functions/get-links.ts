import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const subscriptionId = event.pathParameters?.id;
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const offset = parseInt(event.queryStringParameters?.offset || '0');

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Subscription ID is required',
        }),
      };
    }

    // Query links for the subscription
    const queryResult = await docClient.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `SUBSCRIPTION#${subscriptionId}`,
        ':skPrefix': 'LINK#',
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit,
    }));

    const links = queryResult.Items?.map(item => ({
      id: item.sk,
      email: item.email,
      subject: item.subject,
      from: item.from,
      links: JSON.parse(item.links || '[]'),
      receivedAt: item.receivedAt,
      processedAt: item.processedAt,
    })) || [];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        links,
        count: links.length,
        hasMore: queryResult.LastEvaluatedKey ? true : false,
      }),
    };

  } catch (error) {
    console.error('Get links error:', error);
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
