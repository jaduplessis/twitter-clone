import { config } from "aws-sdk";

const CloudFormation = require("aws-sdk/clients/cloudformation");
const CognitoIdentityServiceProvider = require("aws-sdk/clients/cognitoidentityserviceprovider");
const DynamoDB = require("aws-sdk/clients/dynamodb");
config.update({ region: "eu-west-2" });

const cloudformation = new CloudFormation();
const cognitoidentityserviceprovider = new CognitoIdentityServiceProvider();
const dynamodb = new DynamoDB();

let userPoolId: string;
let userPoolClientId: string;
let userTable: string;
const testuser = "testuser";

describe("Twitter Clone Sign Up Flow", () => {
  beforeAll(async () => {
    // Use outputs to set up test
    const data = await cloudformation
      .describeStacks({ StackName: "TwitterCloneStack" })
      .promise();

    const outputs = data.Stacks[0].Outputs;

    userPoolId = outputs.find(
      (o: { OutputKey: string }) => o.OutputKey === "UserPoolId"
    ).OutputValue;
    userPoolClientId = outputs.find(
      (o: { OutputKey: string }) => o.OutputKey === "UserPoolClientId"
    ).OutputValue;
    userTable = outputs.find(
      (o: { OutputKey: string }) => o.OutputKey === "UserTable"
    ).OutputValue;
  });

  // Sign up a user
  test("User can sign up", async () => {
    const UserSub = await signUpAndConfirm(
      userPoolId,
      userPoolClientId,
      testuser
    );
    const result = await pollDynamoUpdate(UserSub, userTable);
    expect(result).toBeTruthy();

    // Clean up
    // cleanUp(userPoolId, testuser);
  });
});

const signUpAndConfirm = async (
  userPoolId: string,
  userPoolClientId: string,
  testuser: string
) => {
  console.log({ userPoolId, userPoolClientId, testuser });
  // Sign up the user
  let data = await cognitoidentityserviceprovider
    .signUp({
      ClientId: userPoolClientId,
      Username: testuser,
      Password: "Password1!",
      UserAttributes: [
        {
          Name: "name",
          Value: testuser,
        },
        {
          Name: "email",
          Value: "test@test.com",
        },
      ],
    })
    .promise();

  // Confirm the user
  const result = await cognitoidentityserviceprovider
    .adminConfirmSignUp({
      UserPoolId: userPoolId,
      Username: testuser,
    })
    .promise();

  console.log({ data, result });

  return data.UserSub;
};

const pollDynamoUpdate = async (
  UserSub: string,
  userTable: string
): Promise<any> => {
  let getItemParams = {
    TableName: userTable,
    Key: { pk: { S: `USER#${UserSub}` }, sk: { S: `ROOT` } },
  };

  let result = queryDynamoUpdate(getItemParams);
  while (!result) {
    await wait(1000);
    result = queryDynamoUpdate(getItemParams);
  }

  // Return result boolean and UserSub
  return result;
};

// const cleanUp = async (UserPoolId: string, testuser: string): Promise<any> => {
//   // Delete the user
//   let deleteParams = {
//     UserPoolId: UserPoolId,
//     Username: testuser,
//   };
//   cognitoidentityserviceprovider.adminDeleteUser(deleteParams).promise();

//   // Delete the user from the user table
//   let deleteItemParams = {
//     TableName: userTable,
//     Key: { pk: { S: `USER#${UserSub}` }, sk: { S: `ROOT` } },
//   };
//   dynamodb.deleteItem(deleteItemParams).promise();
// };

const wait = async (interval: number) => {
  return new Promise((resolve) => setTimeout(resolve, interval));
};

const queryDynamoUpdate = async (params: any): Promise<any> => {
  const data = await dynamodb.updateItem(params).promise();
  // Return boolean to indicate success
  return data;
};
