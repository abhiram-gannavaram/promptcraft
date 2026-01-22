# PromtCraft - AI Prompt Enhancement Tool

Transform your basic prompts into powerful, structured AI queries.

**Live Demo:** https://promtcraft.in

## Features

- Auto Spell Check - Fixes common spelling and grammar mistakes
- Smart Detection - Identifies prompt type (app dev, writing, debugging, etc.)
- Structured Output - Creates well-organized, professional prompts
- Instant Results - No AI processing delay, rule-based enhancement
- 100% Free - No sign-up, no limits, no ads
- Privacy First - No personal data stored

## Use Cases

| Type | Example Input | What You Get |
|------|---------------|--------------|
| App Development | "build android app for news" | Full tech stack, architecture guide |
| Web Development | "create website for portfolio" | Framework recommendations |
| Debugging | "fix react error useState" | Root cause analysis, solution |
| Content Writing | "write blog about AI" | SEO-optimized structure |
| Brainstorming | "ideas for startup" | Quick wins, innovative solutions |

## Architecture

- CloudFront (CDN + SSL)
- S3 (Static Frontend)
- API Gateway (REST API)
- Lambda (Node.js Backend)
- DynamoDB (Analytics)

## Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Terraform (optional)

### Local Development

```bash
git clone https://github.com/YOUR_USERNAME/promtcraft.git
cd promtcraft
npm install
npm run dev
npm test
```

### Deploy to AWS

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Project Structure

```
promtcraft/
├── frontend/           # Static website files
├── lambda/             # AWS Lambda function
├── terraform/          # Infrastructure as Code
├── .github/workflows/  # CI/CD pipelines
├── tests/              # Test files
└── docs/               # Documentation
```

## API Endpoint

```
POST /generate-prompt
Content-Type: application/json

{
  "prompt": "your prompt here",
  "options": {
    "tone": "professional",
    "length": "balanced"
  }
}
```

## Security

- HTTPS enforced via CloudFront
- Rate limiting (20 requests/minute)
- Input validation and sanitization
- CORS properly configured

## Monthly Cost (~$2.50)

| Service | Cost |
|---------|------|
| S3 | $0.02 |
| DynamoDB | $0.50 |
| Lambda | $0.00 |
| API Gateway | $0.50 |
| CloudFront | $1.00 |
| Route 53 | $0.50 |

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

## License

MIT License

---

Made with love by Abhiram Gannavaram
