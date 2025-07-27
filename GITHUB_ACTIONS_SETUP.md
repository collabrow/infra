# GitHub Actions Setup Guide

This guide will help you set up automatic deployment of your PostgreSQL infrastructure to AWS using GitHub Actions.

## 🚀 Quick Setup

### 1. Prerequisites

- AWS Account with appropriate permissions
- GitHub repository
- AWS CLI configured locally (for initial setup)

### 2. AWS IAM Setup

Create an IAM user for GitHub Actions with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "ec2:*",
                "rds:*",
                "secretsmanager:*",
                "iam:*",
                "lambda:*",
                "logs:*",
                "s3:*",
                "ssm:*",
                "sts:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

#### Required Secrets:
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
- `AWS_REGION`: AWS region (e.g., `us-east-1`)
- `AWS_ACCOUNT_ID`: Your 12-digit AWS account ID

### 4. GitHub Environments Setup

Create environments in your GitHub repository:

1. Go to Settings → Environments
2. Create two environments:
   - `staging`
   - `production`

For the `production` environment, enable:
- Required reviewers (recommended)
- Wait timer (optional, e.g., 5 minutes)
- Deployment branches: Only `main` branch

## 📋 Workflow Overview

### Main Workflows

1. **Deploy Workflow** (`.github/workflows/deploy.yml`)
   - Triggers on push to `main` (production) or `develop` (staging)
   - Runs tests before deployment
   - Deploys to appropriate environment

2. **PR Check Workflow** (`.github/workflows/pr-check.yml`)
   - Triggers on pull requests
   - Runs tests and security checks
   - Provides cost estimation
   - Shows CDK diff

3. **Destroy Workflow** (`.github/workflows/destroy.yml`)
   - Manual trigger only
   - Requires confirmation
   - Destroys infrastructure safely

## 🏗️ Deployment Strategy

### Branch Strategy
- `main` branch → Production environment
- `develop` branch → Staging environment
- Pull requests → Run checks and show diffs

### Environment Configurations

#### Development (Local)
```bash
pnpm run deploy:dev
```
- Instance: db.t3.micro
- Multi-AZ: false
- Storage: 20GB
- Backup: 7 days

#### Staging
```bash
pnpm run deploy:staging
```
- Instance: db.t3.small
- Multi-AZ: false
- Storage: 50GB
- Backup: 14 days

#### Production
```bash
pnpm run deploy:production
```
- Instance: db.t3.medium
- Multi-AZ: true (High Availability)
- Storage: 100GB
- Backup: 30 days
- Deletion Protection: enabled

## 🔧 Manual Deployment Commands

### Local Development
```bash
# Deploy to development
pnpm run deploy:dev

# Show differences before deploying
pnpm run diff:dev

# Generate CloudFormation template
pnpm run synth:dev

# Destroy development stack
pnpm run destroy:dev
```

### Staging Commands
```bash
pnpm run deploy:staging
pnpm run diff:staging
pnpm run synth:staging
pnpm run destroy:staging
```

### Production Commands
```bash
pnpm run deploy:production
pnpm run diff:production
pnpm run synth:production
pnpm run destroy:production
```

## 🔒 Security Best Practices

### 1. IAM Principle of Least Privilege
- Use the minimal IAM permissions required
- Consider using IAM roles with OIDC for GitHub Actions (more secure than access keys)

### 2. Environment Protection
- Enable required reviewers for production deployments
- Use environment-specific secrets
- Enable branch protection rules

### 3. Secret Management
- Rotate AWS access keys regularly
- Use GitHub's dependabot for dependency updates
- Enable security advisories

## 📊 Cost Management

### Expected Monthly Costs

#### Staging Environment (~$75/month)
- RDS db.t3.small: ~$25
- NAT Gateway (1x): ~$45
- EBS Storage (50GB): ~$5

#### Production Environment (~$200/month)
- RDS db.t3.medium Multi-AZ: ~$100
- NAT Gateway (2x): ~$90
- EBS Storage (100GB): ~$10

### Cost Optimization Tips
1. Use `pnpm run destroy:staging` when not needed
2. Consider Reserved Instances for production
3. Monitor usage with AWS Cost Explorer
4. Set up billing alerts

## 🚨 Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Required
```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

#### 2. Insufficient Permissions
- Check IAM policy attached to GitHub Actions user
- Ensure all required AWS services are allowed

#### 3. Stack Already Exists
- Use different stack names for different environments
- Check AWS CloudFormation console for existing stacks

#### 4. Resource Limits
- Check AWS service quotas
- Ensure you have available VPC, RDS instance limits

### Debug Commands
```bash
# Check CDK version
npx cdk --version

# List all stacks
npx cdk list

# Show detailed diff
npx cdk diff --verbose

# Deploy with debug output
npx cdk deploy --verbose
```

## 📈 Monitoring & Alerts

### CloudWatch Integration
- All RDS metrics automatically available
- Performance Insights enabled
- Enhanced monitoring (60-second intervals)

### Recommended Alerts
1. Database CPU utilization > 80%
2. Database connections > 80% of max
3. Free storage space < 20%
4. Failed connection attempts

## 🔄 CI/CD Best Practices

### 1. Always Run Tests
- Unit tests run on every push/PR
- CDK synth validates templates
- Security audits check dependencies

### 2. Staged Deployments
- Test in staging before production
- Use feature flags when possible
- Automated rollback on failure

### 3. Infrastructure as Code
- All changes through Git
- Peer review for production changes
- Audit trail in GitHub

## 📝 Next Steps

1. **Set up AWS credentials** in GitHub Secrets
2. **Create environments** (staging, production) in GitHub
3. **Push to develop branch** to test staging deployment
4. **Create PR to main** for production deployment
5. **Monitor costs** and set up billing alerts
6. **Configure monitoring** and alerting

## 🆘 Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review AWS CloudFormation events
3. Check AWS service quotas
4. Ensure IAM permissions are correct

For more help, refer to:
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
