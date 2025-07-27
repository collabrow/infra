import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface PostgresStackProps extends cdk.StackProps {
  environment: string;
  config: {
    instanceType: string;
    multiAz: boolean;
    deletionProtection: boolean;
    backupRetention: number;
    allocatedStorage: number;
  };
}

export class PostgresStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PostgresStackProps) {
    super(scope, id, props);

    // Create VPC for the RDS instance
    const vpc = new ec2.Vpc(this, 'PostgresVPC', {
      maxAzs: 2, // Use 2 availability zones for high availability
      natGateways: props.environment === 'production' ? 2 : 1, // Cost optimization for non-prod
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'PostgresSecurityGroup', {
      vpc,
      description: 'Security group for PostgreSQL RDS instance',
      allowAllOutbound: false,
    });

    // Allow inbound connections on PostgreSQL port (5432) from VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'PostgresSubnetGroup', {
      vpc,
      description: 'Subnet group for PostgreSQL RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create secret for database credentials
    const dbSecret = new secretsmanager.Secret(this, 'PostgresSecret', {
      description: 'PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Create parameter group for PostgreSQL
    const parameterGroup = new rds.ParameterGroup(this, 'PostgresParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      description: 'Parameter group for PostgreSQL 15.4',
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements',
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
        'log_checkpoints': '1',
        'log_connections': '1',
        'log_disconnections': '1',
      },
    });

    // Create RDS PostgreSQL instance
    const instanceTypeMap: Record<string, ec2.InstanceType> = {
      'db.t3.micro': ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      'db.t3.small': ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      'db.t3.medium': ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      'db.t3.large': ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
    };

    const dbInstance = new rds.DatabaseInstance(this, 'PostgresInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: instanceTypeMap[props.config.instanceType] || instanceTypeMap['db.t3.micro'],
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      multiAz: props.config.multiAz,
      allocatedStorage: props.config.allocatedStorage,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true,
      parameterGroup,
      backupRetention: cdk.Duration.days(props.config.backupRetention),
      deletionProtection: props.config.deletionProtection,
      databaseName: 'postgres',
      port: 5432,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      monitoringInterval: cdk.Duration.seconds(60),
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
      deleteAutomatedBackups: !props.config.deletionProtection,
    });

    // Create bastion host for database access (optional)
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true,
    });

    // Allow SSH access to bastion host
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    const bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc,
      securityGroup: bastionSecurityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Allow bastion host to connect to database
    dbSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from bastion host'
    );

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
      description: `PostgreSQL database endpoint for ${props.environment}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: dbInstance.instanceEndpoint.port.toString(),
      description: 'PostgreSQL database port',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'ARN of the secret containing database credentials',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: `VPC ID where PostgreSQL is deployed for ${props.environment}`,
    });

    new cdk.CfnOutput(this, 'BastionHostId', {
      value: bastionHost.instanceId,
      description: 'Bastion host instance ID for database access',
    });

    new cdk.CfnOutput(this, 'BastionHostPublicIp', {
      value: bastionHost.instancePublicIp,
      description: 'Bastion host public IP address',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: props.environment,
      description: 'Environment name',
    });

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Project', 'PostgreSQL-Infrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
  }
}
