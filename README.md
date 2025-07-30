# AWS CDK PostgreSQL App

This AWS CDK application deploys a PostgreSQL database using Amazon RDS with automatic GitHub Actions deployment.

## 🚀 Quick Start

### GitHub Actions Auto-Deployment
1. **Fork/Clone** this repository
2. **Set up AWS credentials** in GitHub Secrets (see [GitHub Actions Setup Guide](./GITHUB_ACTIONS_SETUP.md))
3. **Push to `develop`** branch → Deploys to staging
4. **Push to `main`** branch → Deploys to production

### Manual Deployment
```bash
# Install dependencies
pnpm install

# Deploy to development
pnpm run deploy:dev

# Deploy to staging
pnpm run deploy:staging

# Deploy to production (requires confirmation)
pnpm run deploy:production
```

## 📋 Architecture

- **VPC**: Custom VPC with public, private, and isolated subnets across 2 AZs
- **PostgreSQL RDS**: Environment-specific configurations
- **Security Groups**: Properly configured for database access
- **Secrets Manager**: Automated credential management
- **VPC Endpoints**: Secure access to AWS services without internet gateway
- **Monitoring**: Performance Insights and CloudWatch enabled

## 🏗️ Environment Configurations

| Environment | Instance Type | Multi-AZ | Storage | Backup | Deletion Protection |
|-------------|---------------|----------|---------|---------|-------------------|
| **Development** | db.t3.micro | ❌ | 20GB | 7 days | ❌ |
| **Staging** | db.t3.small | ❌ | 50GB | 14 days | ❌ |
| **Production** | db.t3.medium | ✅ | 100GB | 30 days | ✅ |

## 🔄 GitHub Actions Workflows

### 1. Deploy Workflow (`.github/workflows/deploy.yml`)
- **Triggers**: Push to `main` (production) or `develop` (staging)
- **Features**: Tests, builds, deploys with environment protection

### 2. PR Check Workflow (`.github/workflows/pr-check.yml`)
- **Triggers**: Pull requests to `main` or `develop`
- **Features**: Tests, security checks, cost estimation, CDK diff

### 3. Destroy Workflow (`.github/workflows/destroy.yml`)
- **Triggers**: Manual only (workflow_dispatch)
- **Features**: Safe infrastructure destruction with confirmation

## 📊 Cost Estimation

### Staging Environment (~$75/month)
- RDS db.t3.small: ~$25
- NAT Gateway (1x): ~$45
- Storage (50GB): ~$5

### Production Environment (~$200/month)
- RDS db.t3.medium Multi-AZ: ~$100
- NAT Gateway (2x): ~$90
- Storage (100GB): ~$10

## 🔧 Available Commands

### Development
```bash
pnpm run deploy:dev       # Deploy to development
pnpm run diff:dev         # Show deployment differences
pnpm run synth:dev        # Generate CloudFormation template
pnpm run destroy:dev      # Destroy development stack
```

### Staging
```bash
pnpm run deploy:staging   # Deploy to staging
pnpm run diff:staging     # Show deployment differences
pnpm run synth:staging    # Generate CloudFormation template
pnpm run destroy:staging  # Destroy staging stack
```

### Production
```bash
pnpm run deploy:production   # Deploy to production
pnpm run diff:production     # Show deployment differences
pnpm run synth:production    # Generate CloudFormation template
pnpm run destroy:production  # Destroy production stack
```

## 🔒 Security Features

- Database deployed in isolated subnets (no internet access)
- Encrypted storage and automated credential rotation
- Security groups with least-privilege access
- VPC endpoints for secure AWS service access without internet gateway
- Environment-specific IAM roles and policies

## 📈 Monitoring & Observability

- **Performance Insights**: Query analysis and optimization
- **CloudWatch Metrics**: CPU, memory, connections, storage
- **Enhanced Monitoring**: 60-second granularity
- **Automated Alerts**: Database health and performance

## 🚨 Prerequisites

1. **AWS Account** with appropriate permissions
2. **Node.js** (v18 or later)
3. **pnpm** package manager (`npm install -g pnpm`)
4. **AWS CDK CLI** installed globally
5. **GitHub repository** with Actions enabled

## ⚙️ GitHub Setup

1. **Create GitHub Secrets** (Repository Settings → Secrets):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_ACCOUNT_ID`

2. **Create GitHub Environments**:
   - `staging` (auto-deploy from `develop` branch)
   - `production` (auto-deploy from `main` branch with protection)

3. **Bootstrap CDK** (one-time setup):
   ```bash
   npx cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

For detailed setup instructions, see [GitHub Actions Setup Guide](./GITHUB_ACTIONS_SETUP.md).

## 🔗 Accessing the Database

### Via VPC Resources
1. Deploy applications or EC2 instances within the same VPC
2. Access database directly from private/isolated subnets
3. Use AWS Systems Manager Session Manager for secure administrative access

### Stack Outputs
After deployment, you'll receive:
- Database endpoint and port
- Database credentials secret ARN
- VPC ID for resource deployment
- Environment information

## 🛠️ Development Workflow

1. **Feature Development**: Work on feature branches
2. **Pull Request**: Create PR → Automatic testing and cost estimation
3. **Staging**: Merge to `develop` → Auto-deploy to staging
4. **Production**: Merge to `main` → Auto-deploy to production (with approval)

## 📝 Testing

```bash
pnpm test                 # Run unit tests
pnpm run build           # Build TypeScript
pnpm run synth:dev       # Validate CDK templates
```

## 🆘 Troubleshooting

### Common Issues
1. **CDK Bootstrap Required**: Run `npx cdk bootstrap`
2. **Insufficient Permissions**: Check IAM policies
3. **Stack Conflicts**: Use environment-specific stack names
4. **Resource Limits**: Check AWS service quotas

### Debug Commands
```bash
npx cdk list              # List all stacks
npx cdk diff --verbose    # Detailed differences
npx cdk deploy --verbose  # Verbose deployment
```

## 🔄 Production Considerations

### High Availability
- Enable Multi-AZ deployment
- Use multiple NAT Gateways
- Set up cross-region backups

### Security Hardening
- Rotate credentials regularly
- Enable VPC Flow Logs
- Configure AWS Config rules
- Set up CloudTrail

### Cost Optimization
- Use Reserved Instances for production
- Schedule start/stop for development environments
- Monitor with AWS Cost Explorer
- Set up billing alerts

## 📚 Additional Resources

- [Detailed Setup Guide](./GITHUB_ACTIONS_SETUP.md)
- [Project Summary](./SUMMARY.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Configuration

### Database Configuration
- **Engine**: PostgreSQL 15.4
- **Instance Type**: t3.micro (suitable for development/testing)
- **Storage**: 20 GB GP2 storage with encryption
- **Backup**: 7-day retention period

### Security Configuration
- Database deployed in isolated subnets (no internet access)
- Access only through VPC resources (applications, EC2 instances)
- Credentials stored in AWS Secrets Manager
- Security groups with minimal required access
- VPC endpoints for secure AWS service communication

## Accessing the Database

### Option 1: From EC2 Instance in VPC

1. Deploy an EC2 instance in the same VPC (private or isolated subnet)
2. Install PostgreSQL client:
   ```bash
   sudo yum update -y
   sudo yum install postgresql15 -y
   ```

3. Get database credentials from Secrets Manager:
   ```bash
   aws secretsmanager get-secret-value --secret-id <secret-arn> --region <region>
   ```

4. Connect to PostgreSQL:
   ```bash
   psql -h <database-endpoint> -U postgres -d postgres
   ```

### Option 2: Using AWS Systems Manager Session Manager

1. Deploy an EC2 instance with Systems Manager permissions
2. Connect via Session Manager for secure access without SSH keys
3. Follow the same steps as Option 1 for database connection

### Option 3: From Application Services

Deploy your applications (ECS, Lambda, etc.) within the same VPC to access the database directly.

## Stack Outputs

After deployment, the stack provides these outputs:

- **DatabaseEndpoint**: PostgreSQL database endpoint
- **DatabasePort**: Database port (5432)
- **DatabaseSecretArn**: ARN of the secret containing credentials
- **VpcId**: VPC ID where resources are deployed

## Production Considerations

For production deployments, consider these modifications:

1. **High Availability**:
   ```typescript
   multiAz: true,  // Enable Multi-AZ deployment
   ```

2. **Instance Size**:
   ```typescript
   instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
   ```

3. **Storage**:
   ```typescript
   allocatedStorage: 100,
   storageType: rds.StorageType.GP3,
   ```

4. **Deletion Protection**:
   ```typescript
   deletionProtection: true,
   ```

5. **Backup**:
   ```typescript
   backupRetention: cdk.Duration.days(30),
   ```

## Cleanup

To delete all resources:

```bash
pnpm run destroy
```

**Warning**: This will permanently delete the database and all data. Make sure to backup any important data before destroying the stack.

## Cost Optimization

For development/testing environments:
- Use t3.micro instance type
- Single AZ deployment
- Reduced backup retention
- Delete unused resources regularly

## Monitoring

The stack includes:
- Performance Insights for query analysis
- CloudWatch metrics for monitoring
- Enhanced monitoring with 60-second granularity
- Database logs for troubleshooting

## Security Best Practices

- Database credentials are automatically generated and stored in Secrets Manager
- Database is deployed in isolated subnets
- Security groups follow principle of least privilege
- Storage encryption is enabled
- SSL/TLS connections can be enforced via parameter groups

## Troubleshooting

1. **Connection Issues**: Check security group rules and network ACLs
2. **Performance Issues**: Use Performance Insights to analyze queries
3. **Storage Issues**: Monitor CloudWatch metrics for storage usage
4. **Backup Issues**: Check backup retention settings and storage

For more detailed AWS CDK documentation, visit: https://docs.aws.amazon.com/cdk/
