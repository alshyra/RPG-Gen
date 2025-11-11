#!/bin/bash

# Test the roll parsing with a sample response from Gemini

SESSION_ID=$(uuidgen)

echo "Testing roll parsing with session: $SESSION_ID"
echo ""

# Send a message
RESPONSE=$(curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Je veux attaquer le monstre\",
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "Response:"
echo "$RESPONSE" | jq .

echo ""
echo "Testing history retrieval:"
curl -s -X GET "http://localhost:3001/api/chat/history?sessionId=$SESSION_ID" | jq .
