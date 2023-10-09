import { Handler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const ddb = new DocumentClient();

export const handler: Handler = async (event) => {
  const userId = event.identity.sub;
  const content = event.arguments.tweet.content;
  const createdAt = Date.now();

  if (process.env.TABLE_NAME === undefined) {
    throw new Error("TABLE_NAME environment variable is not defined.");
  }

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      pk: `USER#${userId}`,
      sk: `TWEET#${Date.now()}`,
      content,
      createdAt,
    },
  };

  try {
    await ddb.put(params).promise();
    return {
      statusCode: 200,
      message: "Tweet added successfully",
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: 500,
      message: "Error adding tweet",
      error: err.message,
    };
  }
};
