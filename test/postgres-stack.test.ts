import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PostgresStack } from '../lib/postgres-stack';

const testConfig = {
  instanceType: 'db.t3.micro',
  multiAz: false,
  deletionProtection: false,
  backupRetention: 7,
  allocatedStorage: 20,
};

test('PostgreSQL Stack creates RDS instance', () => {
  const app = new cdk.App();
  const stack = new PostgresStack(app, 'TestPostgresStack', {
    environment: 'test',
    config: testConfig,
  });
  const template = Template.fromStack(stack);

  // Test that RDS instance is created
  template.hasResourceProperties('AWS::RDS::DBInstance', {
    Engine: 'postgres',
    DBInstanceClass: 'db.t3.micro',
    AllocatedStorage: '20',
    StorageEncrypted: true,
  });

  // Test that VPC is created
  template.hasResourceProperties('AWS::EC2::VPC', {
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
  });

  // Test that security group is created
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    GroupDescription: 'Security group for PostgreSQL RDS instance',
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
    instanceType: 'db.t3.medium',
    multiAz: true,
    deletionProtection: true,
    backupRetention: 30,
    allocatedStorage: 100,
  };
  
  const stack = new PostgresStack(app, 'TestPostgresStackProd', {
    environment: 'production',
    config: prodConfig,
  });
  const template = Template.fromStack(stack);

  // Test that RDS instance has production configuration
  template.hasResourceProperties('AWS::RDS::DBInstance', {
    Engine: 'postgres',
    DBInstanceClass: 'db.t3.medium',
    AllocatedStorage: '100',
    MultiAZ: true,
    DeletionProtection: true,
    BackupRetentionPeriod: 30,
  });
});
