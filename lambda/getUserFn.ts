import { Handler } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const ddb = new DocumentClient();

export const handler: Handler = async (event) => {
  const userId = event.identity.sub;

  if (process.env.TABLE_NAME === undefined) {
    throw new Error("TABLE_NAME environment variable is not defined.");
  }

  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      pk: `USER#${userId}`,
      sk: "ROOT",
    },
  };

  console.log({ params });

  try {
    const { Item } = await ddb.get(params).promise();

    if (!Item) {
      return {
        statusCode: 404,
        message: "User not found",
      };
    }

    return {
      statusCode: 200,
      message: "User retrieved successfully",
      userId: Item.userId,
      name: Item.name,
      email: Item.email,
    };
  } catch (error) {
    console.log("Error: ", error);
    return {
      statusCode: 500,
      message: "Error retrieving user",
      error: error.message,
    };
  }
};
