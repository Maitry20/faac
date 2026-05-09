#!/bin/bash

# =====================================================================
# 🚀 AWS AUTOMATED DEPLOYMENT SCRIPT: FOOD AT A CLICK
# =====================================================================

# Color definitions for pleasant terminal outputs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   🍽️  Food At A Click - AWS Automated Provisioner   ${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# 1. PREREQUISITE & CONNECTION CHECK
echo -e "${YELLOW}[1/7] Checking AWS CLI connectivity...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed or not in your PATH.${NC}"
    echo -e "Please ensure 'brew install awscli' has completed or install the AWS CLI manually."
    exit 1
fi

# Verify AWS credentials are active
AWS_IDENTITY=$(aws sts get-caller-identity --query "Arn" --output text 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Unable to connect to your AWS Account.${NC}"
    echo -e "Please configure your AWS CLI credentials first by running:"
    echo -e "   ${GREEN}aws configure${NC}"
    echo -e "and providing your AWS Access Key, Secret Access Key, and Default Region."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
fi

echo -e "${GREEN}✓ Connected as IAM User: $AWS_IDENTITY${NC}"
echo -e "${GREEN}✓ AWS Region: $AWS_REGION${NC}"
echo -e "${GREEN}✓ AWS Account ID: $AWS_ACCOUNT_ID${NC}\n"


# 2. PROVISION DYNAMODB TABLES
echo -e "${YELLOW}[2/7] Provisioning DynamoDB Tables...${NC}"
TABLES=("faac_profiles" "faac_menuItems" "faac_orders" "faac_reviews")

for TABLE in "${TABLES[@]}"; do
    echo -n "Checking Table '$TABLE'..."
    aws dynamodb describe-table --table-name "$TABLE" &>/dev/null
    if [ $? -eq 0 ]; then
        echo -e " ${GREEN}Already Exists${NC}"
    else
        echo -e " ${YELLOW}Creating On-Demand...${NC}"
        aws dynamodb create-table \
            --table-name "$TABLE" \
            --attribute-definitions AttributeName=id,AttributeType=S \
            --key-schema AttributeName=id,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$AWS_REGION" &>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Table '$TABLE' created successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to create table '$TABLE'${NC}"
            exit 1
        fi
    fi
done
echo -e "\n"


# 3. CREATE IAM ROLE FOR LAMBDA
echo -e "${YELLOW}[3/7] Setting up IAM Role for Serverless Execution...${NC}"
ROLE_NAME="faac-lambda-execution-role"

echo -n "Checking IAM Role '$ROLE_NAME'..."
aws iam get-role --role-name "$ROLE_NAME" &>/dev/null
if [ $? -eq 0 ]; then
    echo -e " ${GREEN}Already Exists${NC}"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query "Role.Arn" --output text)
else
    echo -e " ${YELLOW}Creating...${NC}"
    
    # Trust policy JSON for Lambda
    TRUST_POLICY='{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }'
    
    ROLE_ARN=$(aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" \
        --query "Role.Arn" \
        --output text)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create IAM Role${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Created IAM Role: $ROLE_ARN${NC}"
fi

# Attach CloudWatch Logs Access Policy
echo "Attaching CloudWatch logging policy..."
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Attach DynamoDB Access Policy (Inline Full Access to faac_ tables)
echo "Attaching DynamoDB access policy..."
DYNAMO_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:'"$AWS_REGION"':'"$AWS_ACCOUNT_ID"':table/faac_*"
      ]
    }
  ]
}'

aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "faac-dynamodb-access-policy" \
    --policy-document "$DYNAMO_POLICY"

echo -e "${GREEN}✓ Role policies attached successfully.${NC}"
echo -e "${YELLOW}Waiting 10 seconds for IAM policies to propagate in AWS...${NC}"
sleep 10
echo -e "\n"


# 4. PACKAGE AND DEPLOY LAMBDA
echo -e "${YELLOW}[4/7] Packaging and Deploying Lambda Function...${NC}"
LAMBDA_NAME="faac-orders-handler"
TEMP_DIR="faac_temp_lambda"

mkdir -p "$TEMP_DIR"

# Create index.mjs Lambda handler code
cat << 'EOF' > "$TEMP_DIR/index.mjs"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_MAP = {
  "/profiles": "faac_profiles",
  "/menuItems": "faac_menuItems",
  "/orders": "faac_orders",
  "/reviews": "faac_reviews"
};

export const handler = async (event) => {
  let path = event.requestContext?.http?.path || event.path || "";
  const httpMethod = event.requestContext?.http?.method || event.httpMethod || "GET";
  
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
  };

  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const tableName = TABLE_MAP[path];
  if (!tableName) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Path ${path} not found` })
    };
  }

  try {
    if (httpMethod === "GET") {
      const command = new ScanCommand({ TableName: tableName });
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items)
      };
    }

    if (httpMethod === "POST") {
      const itemData = JSON.parse(event.body);
      const command = new PutCommand({
        TableName: tableName,
        Item: itemData
      });
      await docClient.send(command);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: "Success", data: itemData })
      };
    }

    if (httpMethod === "PUT") {
      const body = JSON.parse(event.body);
      const { id, ...updates } = body;
      
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing 'id' in request body" })
        };
      }

      let updateExpression = "set";
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      
      const keys = Object.keys(updates);
      if (keys.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "No fields to update" })
        };
      }

      keys.forEach((key, index) => {
        const attributeName = `#field${index}`;
        const attributeValue = `:val${index}`;
        
        updateExpression += ` ${attributeName} = ${attributeValue}`;
        if (index < keys.length - 1) {
          updateExpression += ",";
        }
        
        expressionAttributeNames[attributeName] = key;
        expressionAttributeValues[attributeValue] = updates[key];
      });

      const command = new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW"
      });
      
      const result = await docClient.send(command);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Updated", item: result.Attributes })
      };
    }

    if (httpMethod === "DELETE") {
      const { id } = JSON.parse(event.body);
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing 'id' in request body" })
        };
      }
      const command = new DeleteCommand({
        TableName: tableName,
        Key: { id }
      });
      await docClient.send(command);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Deleted successfully" })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: `Method ${httpMethod} not allowed` })
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
EOF

# Zip the code
cd "$TEMP_DIR"
zip -r ../lambda.zip index.mjs &>/dev/null
cd ..

echo -n "Checking if Lambda Function '$LAMBDA_NAME' exists..."
aws lambda get-function --function-name "$LAMBDA_NAME" &>/dev/null
if [ $? -eq 0 ]; then
    echo -e " ${GREEN}Yes, updating code...${NC}"
    aws lambda update-function-code \
        --function-name "$LAMBDA_NAME" \
        --zip-file fileb://lambda.zip &>/dev/null
else
    echo -e " ${YELLOW}No, creating function...${NC}"
    aws lambda create-function \
        --function-name "$LAMBDA_NAME" \
        --runtime nodejs20.x \
        --role "$ROLE_ARN" \
        --handler index.handler \
        --zip-file fileb://lambda.zip \
        --timeout 15 \
        --region "$AWS_REGION" &>/dev/null
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Lambda function successfully deployed.${NC}"
else
    echo -e "${RED}❌ Failed to deploy Lambda function.${NC}"
    rm -rf "$TEMP_DIR" lambda.zip
    exit 1
fi

LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query "Configuration.FunctionArn" --output text)
rm -rf "$TEMP_DIR" lambda.zip
echo -e "\n"


# 5. CREATE AND CONFIGURE API GATEWAY
echo -e "${YELLOW}[5/7] Provisioning AWS API Gateway HTTP API...${NC}"
API_NAME="faac-api"

# Check if API Gateway exists
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo -e "${GREEN}✓ API Gateway '$API_NAME' already exists. ID: $API_ID${NC}"
    # Verify/create default stage just in case
    aws apigatewayv2 get-stage --api-id "$API_ID" --stage-name '$default' &>/dev/null
    if [ $? -ne 0 ]; then
        echo "Creating default stage for existing API Gateway..."
        aws apigatewayv2 create-stage \
            --api-id "$API_ID" \
            --stage-name '$default' \
            --auto-deploy &>/dev/null
    fi
else
    echo "Creating new HTTP API with CORS configured..."
    
    CORS_CONFIG='{
        "AllowOrigins": ["*"],
        "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "AllowHeaders": ["content-type", "authorization"],
        "MaxAge": 300
    }'

    API_ID=$(aws apigatewayv2 create-api \
        --name "$API_NAME" \
        --protocol-type HTTP \
        --cors-configuration "$CORS_CONFIG" \
        --query "ApiId" \
        --output text)
        
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create API Gateway${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Created API Gateway: $API_ID${NC}"
    
    # Create the default stage for the new API Gateway
    aws apigatewayv2 create-stage \
        --api-id "$API_ID" \
        --stage-name '$default' \
        --auto-deploy &>/dev/null
fi

# Link Lambda integration
echo "Checking API Integration with Lambda..."
INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --query "Items[?IntegrationUri=='$LAMBDA_ARN'].IntegrationId" --output text)

if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" == "None" ]; then
    echo "Creating Lambda Integration..."
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id "$API_ID" \
        --integration-type AWS_PROXY \
        --integration-uri "$LAMBDA_ARN" \
        --payload-format-version "2.0" \
        --query "IntegrationId" \
        --output text)
    echo -e "${GREEN}✓ Created Integration ID: $INTEGRATION_ID${NC}"
else
    echo -e "${GREEN}✓ Integration already exists.${NC}"
fi

# Create Routes
ROUTES=("/profiles" "/menuItems" "/orders" "/reviews")
for ROUTE in "${ROUTES[@]}"; do
    echo "Configuring Route 'ANY $ROUTE'..."
    ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='ANY $ROUTE'].RouteId" --output text)
    if [ -z "$ROUTE_ID" ] || [ "$ROUTE_ID" == "None" ]; then
        aws apigatewayv2 create-route \
            --api-id "$API_ID" \
            --route-key "ANY $ROUTE" \
            --target "integrations/$INTEGRATION_ID" &>/dev/null
        echo -e "  ${GREEN}✓ Created routeANY $ROUTE${NC}"
    else
        echo -e "  ${GREEN}✓ Route ANY $ROUTE already configured.${NC}"
    fi
done

# Grant invoke permissions to API Gateway
echo "Granting API Gateway permission to trigger Lambda..."
aws lambda remove-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "faac-apigateway-invoke-permission" &>/dev/null

aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "faac-apigateway-invoke-permission" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$API_ID/*" &>/dev/null

echo -e "${GREEN}✓ Invocations permission set successfully.${NC}"
echo -e "\n"


# 6. RETRIEVE INVOKE URL
echo -e "${YELLOW}[6/7] Retrieving AWS API Gateway Invoke URL...${NC}"
INVOKE_URL=$(aws apigatewayv2 get-api --api-id "$API_ID" --query "ApiEndpoint" --output text)
echo -e "${GREEN}🔥 LIVE AWS API GATEWAY URL: $INVOKE_URL${NC}\n"


# 7. AUTOMATICALLY LINK REACT APP
echo -e "${YELLOW}[7/7] Linkage: Updating React Frontend (src/App.jsx)...${NC}"
node -e "
const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');
const replacement = 'export const API_URL = \"$INVOKE_URL\";';
content = content.replace(/export const API_URL = \".*\";/, replacement);
fs.writeFileSync('src/App.jsx', content, 'utf8');
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCCESS! src/App.jsx has been automatically updated with your live AWS database URL!${NC}"
else
    echo -e "${RED}❌ Failed to auto-link React App. Please manually update the API_URL in src/App.jsx to: $INVOKE_URL${NC}"
fi

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${GREEN}🌟 DEPLOYMENT COMPLETED EXCELLENTLY! 🌟${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "1. Run ${GREEN}npm run dev${NC} to start your local server."
echo -e "2. Open the page. The app will automatically connect to AWS DynamoDB!"
echo -e "3. Since your tables are initially empty, the React frontend will automatically"
echo -e "   seed your live AWS DynamoDB with standard mock data in the background!"
echo -e "${BLUE}====================================================${NC}"
