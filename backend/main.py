from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
import boto3
from boto3.dynamodb.conditions import Key
import uuid
from datetime import datetime
import os
import json
import logging
import traceback
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("survey-api")

app = FastAPI(title="Survey API")

# CORS configuration
origins = [
    "https://topsurvey.cloudspace-consulting.com",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Log the request
    logger.info(f"Request {request_id} started: {request.method} {request.url.path}")
    
    # Process the request
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Request {request_id} completed: {response.status_code} in {process_time:.4f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request {request_id} failed after {process_time:.4f}s: {str(e)}")
        logger.error(traceback.format_exc())
        raise

# DynamoDB configuration
def get_dynamodb():
    """Get DynamoDB resource with appropriate configuration."""
    region = os.environ.get("AWS_REGION", "eu-west-1")
    logger.info(f"Initializing DynamoDB client in region: {region}")
    session = boto3.Session(region_name=region)
    return session.resource("dynamodb")

# Get table references
def get_surveys_table(dynamodb=Depends(get_dynamodb)):
    """Get the surveys table."""
    surveys_table_name = os.environ.get("DYNAMODB_TABLE_SURVEYS", "surveys_db")
    logger.debug(f"Using surveys table: {surveys_table_name}")
    return dynamodb.Table(surveys_table_name)

def get_responses_table(dynamodb=Depends(get_dynamodb)):
    """Get the responses table."""
    responses_table_name = os.environ.get("DYNAMODB_TABLE_RESPONSES", "survey_responses")
    logger.debug(f"Using responses table: {responses_table_name}")
    return dynamodb.Table(responses_table_name)

# Models
class QuestionBase(BaseModel):
    text: str
    type: str
    required: bool = False
    options: Optional[List[str]] = None

class Question(QuestionBase):
    id: str

class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[Question]

class Survey(SurveyCreate):
    id: str
    created_at: str
    responses: int = 0

class AnswerBase(BaseModel):
    question_id: str
    answer: Union[str, List[str]]

class SurveyResponseCreate(BaseModel):
    survey_id: str
    answers: List[AnswerBase]

class SurveyResponse(SurveyResponseCreate):
    id: str
    created_at: str

# Helper function to safely serialize any object to a DynamoDB-compatible format
def serialize_for_dynamodb(data):
    """Convert data to a format that DynamoDB can store."""
    if isinstance(data, dict):
        return {k: serialize_for_dynamodb(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [serialize_for_dynamodb(i) for i in data]
    elif isinstance(data, (int, float, str, bool, type(None))):
        return data
    else:
        # Convert other types to strings
        return str(data)

# Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to the Survey API"}

@app.post("/surveys", response_model=Survey)
async def create_survey(survey: SurveyCreate, table=Depends(get_surveys_table)):
    """Create a new survey."""
    try:
        logger.info(f"Creating new survey: {survey.title}")
        logger.debug(f"Survey data: {survey.model_dump_json()}")
        
        # Generate a unique ID and timestamp
        survey_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Explicitly convert Pydantic models to dictionaries
        # For Pydantic v2, we use model_dump() instead of dict()
        try:
            questions_data = []
            for q in survey.questions:
                # Try to use model_dump() first (Pydantic v2)
                try:
                    q_dict = q.model_dump()
                except AttributeError:
                    # Fall back to dict() for Pydantic v1
                    q_dict = q.dict()
                questions_data.append(q_dict)
            
            logger.debug(f"Processed questions data: {json.dumps(questions_data)}")
        except Exception as e:
            logger.error(f"Error processing questions: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error processing survey questions: {str(e)}")
        
        # Prepare survey data
        survey_data = {
            "id": survey_id,
            "title": survey.title,
            "description": survey.description or "",
            "questions": questions_data,
            "created_at": timestamp,
            "responses": 0
        }
        
        # Log the data being sent to DynamoDB
        logger.debug(f"Sending data to DynamoDB: {json.dumps(survey_data)}")
        
        # Ensure data is in a format DynamoDB can handle
        dynamodb_item = serialize_for_dynamodb(survey_data)
        
        # Save to DynamoDB
        logger.info(f"Saving survey {survey_id} to DynamoDB")
        table.put_item(Item=dynamodb_item)
        
        logger.info(f"Successfully created survey with ID: {survey_id}")
        
        return Survey(**survey_data)
    except Exception as e:
        logger.error(f"Error creating survey: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating survey: {str(e)}")

@app.get("/surveys", response_model=List[Survey])
async def list_surveys(table=Depends(get_surveys_table)):
    """List all surveys."""
    try:
        logger.info("Fetching all surveys")
        response = table.scan()
        
        surveys = response.get('Items', [])
        logger.info(f"Found {len(surveys)} surveys")
        
        # Parse questions from JSON if stored as string
        for survey in surveys:
            if isinstance(survey.get('questions'), str):
                survey['questions'] = json.loads(survey['questions'])
        
        return surveys
    except Exception as e:
        logger.error(f"Error listing surveys: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error listing surveys: {str(e)}")

@app.get("/surveys/{survey_id}", response_model=Survey)
async def get_survey(survey_id: str, table=Depends(get_surveys_table)):
    """Get a specific survey by ID."""
    try:
        logger.info(f"Fetching survey with ID: {survey_id}")
        response = table.get_item(Key={"id": survey_id})
        
        survey = response.get('Item')
        if not survey:
            logger.warning(f"Survey not found with ID: {survey_id}")
            raise HTTPException(status_code=404, detail="Survey not found")
        
        # Parse questions from JSON if stored as string
        if isinstance(survey.get('questions'), str):
            survey['questions'] = json.loads(survey['questions'])
        
        logger.info(f"Successfully retrieved survey: {survey_id}")
        return survey
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving survey {survey_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error retrieving survey: {str(e)}")

@app.post("/surveys/{survey_id}/responses", response_model=SurveyResponse)
async def submit_response(
    survey_id: str, 
    response_data: SurveyResponseCreate, 
    surveys_table=Depends(get_surveys_table),
    responses_table=Depends(get_responses_table)
):
    """Submit a response to a survey."""
    try:
        logger.info(f"Submitting response for survey ID: {survey_id}")
        
        # Verify survey exists
        survey_result = surveys_table.get_item(Key={"id": survey_id})
        
        if not survey_result.get('Item'):
            logger.warning(f"Survey not found with ID: {survey_id}")
            raise HTTPException(status_code=404, detail="Survey not found")
        
        # Generate response ID and timestamp
        response_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Convert to dict using model_dump or dict
        try:
            answers_data = []
            for answer in response_data.answers:
                try:
                    a_dict = answer.model_dump()
                except AttributeError:
                    a_dict = answer.dict()
                answers_data.append(a_dict)
            
            logger.debug(f"Processed answers data: {json.dumps(answers_data)}")
        except Exception as e:
            logger.error(f"Error processing answers: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error processing survey answers: {str(e)}")
        
        # Prepare response data
        response_item = {
            "id": response_id,
            "survey_id": survey_id,
            "answers": answers_data,
            "created_at": timestamp
        }
        
        # Ensure data is in a format DynamoDB can handle
        dynamodb_item = serialize_for_dynamodb(response_item)
        
        # Save response
        logger.info(f"Saving response {response_id} for survey {survey_id}")
        responses_table.put_item(Item=dynamodb_item)
        
        # Update survey response count
        logger.info(f"Updating response count for survey {survey_id}")
        surveys_table.update_item(
            Key={"id": survey_id},
            UpdateExpression="SET responses = if_not_exists(responses, :zero) + :one",
            ExpressionAttributeValues={
                ":zero": 0,
                ":one": 1
            }
        )
        
        logger.info(f"Successfully submitted response {response_id} for survey {survey_id}")
        
        return SurveyResponse(**response_item)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting response: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error submitting response: {str(e)}")

@app.get("/surveys/{survey_id}/responses", response_model=List[SurveyResponse])
async def get_survey_responses(
    survey_id: str, 
    surveys_table=Depends(get_surveys_table),
    responses_table=Depends(get_responses_table)
):
    """Get all responses for a specific survey."""
    try:
        logger.info(f"Fetching responses for survey ID: {survey_id}")
        
        # Verify survey exists
        survey_result = surveys_table.get_item(Key={"id": survey_id})
        
        if not survey_result.get('Item'):
            logger.warning(f"Survey not found with ID: {survey_id}")
            raise HTTPException(status_code=404, detail="Survey not found")
        
        # Get responses
        response = responses_table.query(
            IndexName='survey_id-index',
            KeyConditionExpression=Key('survey_id').eq(survey_id)
        )
        
        responses = response.get('Items', [])
        logger.info(f"Found {len(responses)} responses for survey {survey_id}")
        
        # Parse answers from JSON if stored as string
        for resp in responses:
            if isinstance(resp.get('answers'), str):
                resp['answers'] = json.loads(resp['answers'])
        
        return responses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving responses for survey {survey_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error retrieving responses: {str(e)}")

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint for ALB."""
    logger.info("Health check requested")
    return {"message": "Service is healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=80, reload=True)