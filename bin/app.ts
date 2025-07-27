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
    minCapacity: 0.5,
    maxCapacity: 2,
    deletionProtection: false,
    backupRetention: 7,
  },
  staging: {
    minCapacity: 0.5,
    maxCapacity: 4,
    deletionProtection: false,
    backupRetention: 14,
  },
  production: {
    minCapacity: 1,
    maxCapacity: 16,
    deletionProtection: true,
    backupRetention: 30,
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
  description: `Aurora PostgreSQL Serverless v2 cluster for ${environment} environment with I/O-Optimized storage`
});
