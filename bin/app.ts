#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PostgresStack } from '../lib/postgres-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

// Environment-specific configurations
const envConfig = {
  dev: {
    instanceType: 'db.t3.micro',
    multiAz: false,
    deletionProtection: false,
    backupRetention: 7,
    allocatedStorage: 20,
  },
  staging: {
    instanceType: 'db.t3.small',
    multiAz: false,
    deletionProtection: false,
    backupRetention: 14,
    allocatedStorage: 50,
  },
  production: {
    instanceType: 'db.t3.medium',
    multiAz: true,
    deletionProtection: true,
    backupRetention: 30,
    allocatedStorage: 100,
  },
};

// Create stack with environment-specific name and config
new PostgresStack(app, `PostgresStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment,
  config: envConfig[environment as keyof typeof envConfig] || envConfig.dev,
  description: `PostgreSQL RDS instance for ${environment} environment with VPC and security groups`
});
