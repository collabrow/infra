import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PostgresStack } from '../lib/postgres-stack';

const testConfig = {
  minCapacity: 0.5,
  maxCapacity: 2,
  deletionProtection: false,
  backupRetention: 7,
};

test('PostgreSQL Stack creates Aurora cluster', () => {
  const app = new cdk.App();
  const stack = new PostgresStack(app, 'TestPostgresStack', {
    environment: 'test',
    config: testConfig,
  });
  const template = Template.fromStack(stack);

  // Test that Aurora cluster is created
  template.hasResourceProperties('AWS::RDS::DBCluster', {
    Engine: 'aurora-postgresql',
    StorageEncrypted: true,
    StorageType: 'aurora-iopt1',
  });

  // Test that VPC is created
  template.hasResourceProperties('AWS::EC2::VPC', {
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
  });

  // Test that security group is created
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    GroupDescription: 'Security group for Aurora PostgreSQL cluster',
  });

  // Test that secret is created
  template.hasResourceProperties('AWS::SecretsManager::Secret', {
    Description: 'PostgreSQL database credentials',
  });

  // Test that bastion host is created
  template.hasResourceProperties('AWS::EC2::Instance', {
    InstanceType: 't3.nano',
  });
});

test('PostgreSQL Stack has correct outputs', () => {
  const app = new cdk.App();
  const stack = new PostgresStack(app, 'TestPostgresStack', {
    environment: 'test',
    config: testConfig,
  });
  const template = Template.fromStack(stack);

  // Check for required outputs
  template.hasOutput('DatabaseEndpoint', {});
  template.hasOutput('DatabasePort', {});
  template.hasOutput('DatabaseSecretArn', {});
  template.hasOutput('VpcId', {});
  template.hasOutput('BastionHostId', {});
  template.hasOutput('BastionHostPublicIp', {});
  template.hasOutput('Environment', {});
});

test('Production environment has different configuration', () => {
  const app = new cdk.App();
  const prodConfig = {
    minCapacity: 1,
    maxCapacity: 16,
    deletionProtection: true,
    backupRetention: 30,
  };
  
  const stack = new PostgresStack(app, 'TestPostgresStackProd', {
    environment: 'production',
    config: prodConfig,
  });
  const template = Template.fromStack(stack);

  // Test that Aurora cluster has production configuration
  template.hasResourceProperties('AWS::RDS::DBCluster', {
    Engine: 'aurora-postgresql',
    DeletionProtection: true,
    BackupRetentionPeriod: 30,
    StorageType: 'aurora-iopt1',
    ServerlessV2ScalingConfiguration: {
      MinCapacity: 1,
      MaxCapacity: 16,
    },
  });
});
