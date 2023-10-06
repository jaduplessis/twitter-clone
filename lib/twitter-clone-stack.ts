import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class TwitterCloneStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a Cognito User Pool
    const pool = new cognito.UserPool(this, "TwitterCloneUserPool", {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add an app client to the user pool
    const client = pool.addClient("app-client", {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID],
        callbackUrls: ["https://my-app-domain.com/welcome"],
        logoutUrls: ["https://my-app-domain.com/signin"],
      },
      accessTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
    });

    // Create a DynamoDB User table
    const userTable = new dynamodb.Table(this, "TwitterCloneUserTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create a Lambda trigger for the User Pool to add users to the User table on confirmation
    const addUserToDynamoFn = new NodejsFunction(this, "addUserToDynamoFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: "lambda/addUserToDynamoFn.ts",
      handler: "handler",
      environment: {
        TABLE_NAME: userTable.tableName,
      },
      bundling: {},
    });

    // Give the Lambda function permissions to write to the User table
    userTable.grantReadWriteData(addUserToDynamoFn);

    // Add the Lambda trigger to the User Pool
    pool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      addUserToDynamoFn
    );

    // // Create an AppSync API
    // const api = new appsync.GraphqlApi(this, "TwitterCloneApi", {
    //   name: "TwitterCloneApi",
    //   definition: appsync.Definition.fromFile("graphql/schema.graphql"),
    //   authorizationConfig: {
    //     defaultAuthorization: {
    //       authorizationType: appsync.AuthorizationType.USER_POOL,
    //     },
    //   },
    // });

    // // Create a Lambda data source
    // const getUserFn = new NodejsFunction(this, "getUserFn", {
    //   runtime: lambda.Runtime.NODEJS_16_X,
    //   entry: "lambda/getUserFn.ts",
    //   handler: "handler",
    //   environment: {
    //     TABLE_NAME: userTable.tableName,
    //   },
    // });

    // // Add lambda data source
    // const getMyUserDataSource = api.addLambdaDataSource(
    //   "GetMyUserDataSource",
    //   getUserFn
    // );

    // // Create a resolver for the getUser query
    // getMyUserDataSource.createResolver("get-my-user-resolver", {
    //   typeName: "Query",
    //   fieldName: "getMyUser",
    // });

    // Save outputs
    new CfnOutput(this, "UserPoolId", { value: pool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: client.userPoolClientId });
    new CfnOutput(this, "UserTable", { value: userTable.tableName });
  }
}
