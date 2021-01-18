import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export default async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        body: JSON.stringify({ connected: true }),
    };    
}