# Flow
* Users can create multiple maps, each for a different topic
* Users use the initial text box and put in their topic or current notes to start a new map
* We get an LLM response initially and send that
* User can send follow up messages
* When user is done with the chat, TWO things are returned:
  1. A short 2-3 sentence summary
  2. A reformatted version of the entire conversation as one cohesive note
* If the user wants to go back and continue the chat, they can - the conversation continues and when finished, new summary + reformatted versions are generated
* User can highlight any section from any block and start a new chat
* When creating a new chat from highlighted text, only send:
  - The 2-3 sentence summary from the parent block
  - The highlighted text with surrounding context (a few sentences before/after)
  - NOT the entire previous conversation
* Each block has its own ID, and we track which blocks link to which
* Visually, this makes a nice mind map powered by LLMs

# Tech Stack 
* Markdown is used for each of the notes
* Google Gemini's API is used for the LLM
* Users are logged in with just a user id, which is passed with each request as authorization
* **Data Storage**: JSON files (no database for MVP)
  - Each user has their own JSON file: `data/{user_id}.json`
  - Simple read/write operations
  - Structure: `{ "maps": [], "blocks": [], "messages": [], "blockLinks": [] }`

# API Documentation

## Authentication
All requests require: `Authorization: {user_id}`

## Endpoints

### 1. Create Map
`POST /api/map/create`

**Request:** `{ "message": "string" }`

**Response:** `{ "mapId", "title" (emoji + title generated from message), "createdAt" }`

### 2. Get All Maps
`GET /api/user/maps`

**Response:** `{ "maps": [{ "mapId", "title", "createdAt", "lastModified" }] }`

### 3. Delete Map
`DELETE /api/map/{mapId}`

**Response:** `{ "success", "deletedMapId" }`

### 4. Create Block
`POST /api/block/create`

**Request:** `{ "mapId": "string", "message": "string", "parentBlockId": "string (optional)", "highlightedText": "string (optional)", "contextRange": "string (optional)" }`

**Response:** `{ "blockId", "title" (emoji + title), "response" (markdown), "timestamp" }`

### 5. Send Message to Block
`POST /api/block/{blockId}/message`

**Request:** `{ "message": "string" }`

**Response:** `{ "messageId", "response" (markdown), "timestamp" }`

### 6. Finalize Block
`POST /api/block/{blockId}/finalize`

Returns both summary and reformatted content.

**Response:** `{ "summary" (2-3 sentences), "reformattedContent" (markdown), "isFinalized": true, "timestamp" }`

### 7. Reopen Block
`POST /api/block/{blockId}/reopen`

**Response:** `{ "blockId", "isFinalized": false, "messages": [] }`
### 8. Delete Block
`DELETE /api/block/{blockId}`

**Response:** `{ "success", "deletedBlockIds": [] }`

### 9. Get Entire Map
`GET /api/map/{mapId}`

Returns all blocks for a specific map. Root blocks include both summary and reformatted content when finalized. Child blocks only include summary when finalized.

**Response:** 
```json
{
  "mapId": "string",
  "title": "string (emoji + title)",
  "blocks": [
    {
      "blockId": "string",
      "title": "string (emoji + title)",
      "parentBlockId": "string | null",
      "isFinalized": boolean,
      "summary": "string (if finalized)",
      "reformattedContent": "string (only for root blocks when finalized)",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

## Data Models

**Map:** `{ mapId, userId, title (emoji + title), createdAt, updatedAt }`

**Block:** `{ blockId, mapId, userId, parentBlockId, title (emoji + title), summary (2-3 sentences), reformattedContent (markdown), isFinalized, createdAt, updatedAt }`

**Message:** `{ messageId, blockId, role (user|assistant), content (markdown), timestamp }`

**BlockLink:** `{ blockId, parentBlockId, highlightedText, contextRange (text before/after highlight) }`

**User Data File Structure:**
```json
{
  "userId": "string",
  "maps": [/* Map objects */],
  "blocks": [/* Block objects */],
  "messages": [/* Message objects */],
  "blockLinks": [/* BlockLink objects */]
}
```

## LLM Context Strategy

**For new block from highlight:**
- Send parent block's 2-3 sentence summary
- Send highlighted text + surrounding context (~2-3 sentences before/after)
- Do NOT send full conversation history

**System Prompts:**
1. **Chat response**: Conversational, educational, markdown formatted
2. **Title generation**: Generate emoji + short title
3. **Finalization**: Return both:
   - 2-3 sentence summary of key points
   - Reformatted conversation as one cohesive note (no conversation format)

## Errors
- 400: Invalid input
- 401: Missing/invalid user_id
- 404: Not found
- 500: Server error

**Format:** `{ "error", "message", "statusCode" }`