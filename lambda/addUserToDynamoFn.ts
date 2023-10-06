import { Handler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const ddb = new DocumentClient();

export const handler: Handler = async (event) => {
  const { sub, email, name } = event.request.userAttributes;
  console.log("event", event);

  if (process.env.TABLE_NAME === undefined) {
    throw new Error("TABLE_NAME environment variable is not defined.");
  }

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      pk: `USER#${sub}`,
      sk: "ROOT",
      userId: sub,
      name,
      email,
    },
  };

  try {
    await ddb.put(params).promise();
    return event;
  } catch (err) {
    console.log("Error", err);
    return err;
  }
};
