# Newsletter Automation App

A full-stack serverless application that automatically signs up for newsletters and extracts links from incoming emails using browser automation and LLM processing.

## Features

- **Automated Newsletter Signup**: Automatically fills out and submits newsletter signup forms
- **Multiple Automation Frameworks**: Support for Playwright, Skyvern, and Browserbase
- **Email Processing**: Automatically processes incoming newsletters
- **Link Extraction**: Uses LLM to extract and categorize links from emails
- **Real-time Dashboard**: Web interface to manage subscriptions and view extracted links
- **Serverless Architecture**: Built with SST (Serverless Stack) on AWS

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend APIs   │    │   Automation    │
│   (Next.js)     │◄──►│   (Lambda)       │◄──►│   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Email Service  │
                       │   (SES/SNS)      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   LLM Service    │
                       │   (OpenAI API)   │
                       └──────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: AWS Lambda, API Gateway, DynamoDB
- **Automation**: Playwright, Skyvern, Browserbase
- **LLM**: OpenAI GPT-3.5-turbo
- **Infrastructure**: SST (Serverless Stack)
- **Email**: AWS SES/SNS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured
- OpenAI API key
- (Optional) Skyvern API key
- (Optional) Browserbase API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newsletter-automation-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

4. **Deploy the application**
   ```bash
   npm run deploy
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
EMAIL_DOMAIN=newsletter-automation.com

# Optional - for Skyvern automation
SKYVERN_API_KEY=your_skyvern_api_key_here
SKYVERN_BASE_URL=https://api.skyvern.com

# Optional - for Browserbase automation
BROWSERBASE_API_KEY=your_browserbase_api_key_here
BROWSERBASE_BASE_URL=https://api.browserbase.com
BROWSERBASE_PROJECT_ID=your_browserbase_project_id_here
```

## Usage

### 1. Newsletter Signup

1. Open the web application
2. Navigate to the "Sign Up" tab
3. Enter a website URL with a newsletter signup form
4. Select an automation framework (Playwright recommended)
5. Click "Sign Up for Newsletter"

The app will:
- Generate a unique email address
- Navigate to the website
- Find and fill the newsletter signup form
- Submit the form
- Store the subscription details

### 2. Email Processing

When newsletters arrive at the generated email addresses:
- Emails are automatically processed
- Links are extracted using LLM
- Links are categorized (internal, external, social, unsubscribe)
- All data is stored in DynamoDB

### 3. Viewing Results

- **Subscriptions**: View all active newsletter subscriptions
- **Links**: Browse extracted links with filtering and search
- **Analytics**: See link extraction statistics

## Automation Framework Comparison

### Playwright (Recommended)
- **Pros**: Fast, reliable, good form detection, free
- **Cons**: Requires more setup, limited to single browser
- **Best for**: Most newsletter sites, development/testing

### Skyvern
- **Pros**: AI-powered, handles complex forms, cloud-based
- **Cons**: Requires API key, may be slower, cost per task
- **Best for**: Complex or dynamic forms

### Browserbase
- **Pros**: Cloud-based, scalable, good for production
- **Cons**: Requires API key, additional cost
- **Best for**: Production deployments, high volume

## API Endpoints

- `POST /api/newsletter/signup` - Sign up for a newsletter
- `POST /api/newsletter/process-email` - Process incoming email
- `GET /api/links` - Get extracted links
- `GET /api/subscriptions` - Get all subscriptions
- `DELETE /api/subscriptions/{id}` - Delete subscription

## Development

### Local Development

```bash
# Start SST development server
npm run dev

# Start frontend development server
cd frontend && npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint
```

### Deployment

```bash
# Deploy to AWS
npm run deploy

# Remove deployment
npm run remove
```

## Project Structure

```
newsletter-automation-app/
├── backend/
│   └── functions/           # Lambda functions
├── frontend/
│   └── src/                 # Next.js application
├── lib/
│   ├── automation/          # Automation frameworks
│   ├── email-service.ts     # Email utilities
│   └── link-extractor.ts    # LLM link extraction
├── sst.config.ts           # SST configuration
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the automation framework comparison

## Roadmap

- [ ] n8n integration for workflow automation
- [ ] Slack/Google Sheets integration
- [ ] Advanced link categorization
- [ ] Email template analysis
- [ ] Subscription analytics dashboard
- [ ] Multi-language support
