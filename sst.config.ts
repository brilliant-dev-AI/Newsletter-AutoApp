import { SSTConfig } from "sst";
import { Api, Table, NextjsSite } from "sst/constructs";

export default {
  config() {
    return {
      name: "newsletter-automation-app",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      // DynamoDB table for storing links and subscriptions
      const table = new Table(stack, "NewsletterData", {
        fields: {
          pk: "string", // primary key
          sk: "string", // sort key
          email: "string",
          url: "string",
          links: "string", // JSON string of extracted links
          status: "string",
          createdAt: "string",
          updatedAt: "string",
        },
        primaryIndex: { partitionKey: "pk", sortKey: "sk" },
        globalIndexes: {
          EmailIndex: {
            partitionKey: "email",
            sortKey: "sk",
          },
        },
      });

      // API Gateway with Lambda functions
      const api = new Api(stack, "Api", {
        defaults: {
          function: {
            environment: {
              TABLE_NAME: table.tableName,
              OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
              EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY || "",
            },
          },
        },
        routes: {
          "POST /api/newsletter/signup": "backend/functions/newsletter-signup.handler",
          "POST /api/newsletter/process-email": "backend/functions/email-processor.handler",
          "GET /api/links": "backend/functions/get-links.handler",
          "GET /api/subscriptions": "backend/functions/get-subscriptions.handler",
          "DELETE /api/subscriptions/{id}": "backend/functions/delete-subscription.handler",
        },
      });

      // Grant permissions to API functions
      api.bind([table]);

      // Next.js frontend
      const site = new NextjsSite(stack, "Site", {
        path: "frontend",
        environment: {
          NEXT_PUBLIC_API_URL: api.url,
        },
      });

      // Output API URL for frontend
      stack.addOutputs({
        ApiUrl: api.url,
        SiteUrl: site.url,
        TableName: table.tableName,
      });

      return { api, table, site };
    });
  },
} satisfies SSTConfig;
