import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const limit = parseInt(event.queryStringParameters?.limit || '50');
    const status = event.queryStringParameters?.status;

    // Build filter expression
    let filterExpression = 'begins_with(pk, :pkPrefix) AND sk = :skValue';
    const expressionAttributeValues: any = {
      ':pkPrefix': 'SUBSCRIPTION#',
      ':skValue': 'METADATA',
    };

    if (status) {
      filterExpression += ' AND #status = :status';
      expressionAttributeValues[':status'] = status;
    }

    const scanResult = await docClient.send(new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
      Limit: limit,
    }));

    const subscriptions = scanResult.Items?.map(item => ({
      id: item.pk.replace('SUBSCRIPTION#', ''),
      email: item.email,
      url: item.url,
      status: item.status,
      framework: item.framework,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      lastEmailReceived: item.lastEmailReceived,
    })) || [];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        subscriptions,
        count: subscriptions.length,
        hasMore: scanResult.LastEvaluatedKey ? true : false,
      }),
    };

  } catch (error) {
    console.error('Get subscriptions error:', error);
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
