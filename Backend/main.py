from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
from datetime import datetime
import uuid

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods including OPTIONS
    allow_headers=["*"],  # Allows all headers including Authorization
)

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

# Request Models
class CreateMapRequest(BaseModel):
    message: str

class CreateBlockRequest(BaseModel):
    mapId: str
    message: str
    parentBlockId: Optional[str] = None
    highlightedText: Optional[str] = None
    contextRange: Optional[str] = None

class SendMessageRequest(BaseModel):
    message: str

# Helper Functions
def get_user_file_path(user_id: str) -> str:
    return os.path.join(DATA_DIR, f"{user_id}.json")

def load_user_data(user_id: str) -> dict:
    file_path = get_user_file_path(user_id)
    if not os.path.exists(file_path):
        return {
            "userId": user_id,
            "maps": [],
            "blocks": [],
            "messages": [],
            "blockLinks": []
        }
    with open(file_path, 'r') as f:
        return json.load(f)

def save_user_data(user_id: str, data: dict):
    file_path = get_user_file_path(user_id)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def get_user_id(authorization: str = Header(...)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing user_id")
    return authorization

# Endpoints
@app.post("/api/map/create")
async def create_map(req: CreateMapRequest, user_id: str = Header(alias="authorization")):
    from llm_provider import generate_title
    
    data = load_user_data(user_id)
    map_id = str(uuid.uuid4())
    
    # Generate title from message
    title = await generate_title(req.message)
    
    new_map = {
        "mapId": map_id,
        "userId": user_id,
        "title": title,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    data["maps"].append(new_map)
    save_user_data(user_id, data)
    
    return {"mapId": map_id, "title": title, "createdAt": new_map["createdAt"]}

@app.get("/api/user/maps")
async def get_all_maps(user_id: str = Header(alias="authorization")):
    data = load_user_data(user_id)
    maps = [{
        "mapId": m["mapId"],
        "title": m["title"],
        "createdAt": m["createdAt"],
        "lastModified": m["updatedAt"]
    } for m in data["maps"]]
    return {"maps": maps}

@app.delete("/api/map/{map_id}")
async def delete_map(map_id: str, user_id: str = Header(alias="authorization")):
    data = load_user_data(user_id)
    
    # Remove map
    data["maps"] = [m for m in data["maps"] if m["mapId"] != map_id]
    
    # Remove all blocks in this map
    block_ids = [b["blockId"] for b in data["blocks"] if b["mapId"] == map_id]
    data["blocks"] = [b for b in data["blocks"] if b["mapId"] != map_id]
    
    # Remove messages and links for those blocks
    data["messages"] = [m for m in data["messages"] if m["blockId"] not in block_ids]
    data["blockLinks"] = [l for l in data["blockLinks"] if l["blockId"] not in block_ids]
    
    save_user_data(user_id, data)
    return {"success": True, "deletedMapId": map_id}

@app.post("/api/block/create")
async def create_block(req: CreateBlockRequest, user_id: str = Header(alias="authorization")):
    from llm_provider import generate_chat_response, generate_title
    
    data = load_user_data(user_id)
    block_id = str(uuid.uuid4())
    
    # Build context for LLM
    if req.parentBlockId:
        # Find parent block
        parent = next((b for b in data["blocks"] if b["blockId"] == req.parentBlockId), None)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent block not found")
        
        # Create context from parent summary + highlighted text
        context = f"Previous context: {parent.get('summary', '')}\n\nHighlighted section: {req.highlightedText}\n"
        if req.contextRange:
            context += f"Surrounding context: {req.contextRange}\n"
        context += f"\nUser question: {req.message}"
        
        # Create block link
        data["blockLinks"].append({
            "blockId": block_id,
            "parentBlockId": req.parentBlockId,
            "highlightedText": req.highlightedText,
            "contextRange": req.contextRange
        })
    else:
        context = req.message
    
    # Get LLM response
    response = await generate_chat_response(context)
    title = await generate_title(req.message)
    
    # Create block
    new_block = {
        "blockId": block_id,
        "mapId": req.mapId,
        "userId": user_id,
        "parentBlockId": req.parentBlockId,
        "title": title,
        "summary": None,
        "reformattedContent": None,
        "isFinalized": False,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    # Create initial messages
    user_message = {
        "messageId": str(uuid.uuid4()),
        "blockId": block_id,
        "role": "user",
        "content": req.message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    assistant_message = {
        "messageId": str(uuid.uuid4()),
        "blockId": block_id,
        "role": "assistant",
        "content": response,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    data["blocks"].append(new_block)
    data["messages"].extend([user_message, assistant_message])
    save_user_data(user_id, data)
    
    return {
        "blockId": block_id,
        "title": title,
        "response": response,
        "timestamp": assistant_message["timestamp"]
    }

@app.post("/api/block/{block_id}/message")
async def send_message(block_id: str, req: SendMessageRequest, user_id: str = Header(alias="authorization")):
    from llm_provider import generate_chat_response
    
    data = load_user_data(user_id)
    
    # Check block exists
    block = next((b for b in data["blocks"] if b["blockId"] == block_id), None)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Get conversation history
    history = [m for m in data["messages"] if m["blockId"] == block_id]
    
    # Get LLM response with history
    response = await generate_chat_response(req.message, history)
    
    # Save messages
    user_message = {
        "messageId": str(uuid.uuid4()),
        "blockId": block_id,
        "role": "user",
        "content": req.message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    assistant_message = {
        "messageId": str(uuid.uuid4()),
        "blockId": block_id,
        "role": "assistant",
        "content": response,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    data["messages"].extend([user_message, assistant_message])
    
    # Update block timestamp
    for b in data["blocks"]:
        if b["blockId"] == block_id:
            b["updatedAt"] = datetime.utcnow().isoformat()
            break
    
    save_user_data(user_id, data)
    
    return {
        "messageId": assistant_message["messageId"],
        "response": response,
        "timestamp": assistant_message["timestamp"]
    }

@app.post("/api/block/{block_id}/finalize")
async def finalize_block(block_id: str, user_id: str = Header(alias="authorization")):
    from llm_provider import generate_finalization
    
    data = load_user_data(user_id)
    
    block = next((b for b in data["blocks"] if b["blockId"] == block_id), None)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Get conversation history
    history = [m for m in data["messages"] if m["blockId"] == block_id]
    
    # Generate summary and reformatted content
    summary, reformatted = await generate_finalization(history)
    
    # Update block
    for b in data["blocks"]:
        if b["blockId"] == block_id:
            b["summary"] = summary
            b["reformattedContent"] = reformatted
            b["isFinalized"] = True
            b["updatedAt"] = datetime.utcnow().isoformat()
            break
    
    save_user_data(user_id, data)
    
    return {
        "summary": summary,
        "reformattedContent": reformatted,
        "isFinalized": True,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/block/{block_id}/reopen")
async def reopen_block(block_id: str, user_id: str = Header(alias="authorization")):
    data = load_user_data(user_id)
    
    block = next((b for b in data["blocks"] if b["blockId"] == block_id), None)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Reopen block
    for b in data["blocks"]:
        if b["blockId"] == block_id:
            b["isFinalized"] = False
            b["summary"] = None
            b["reformattedContent"] = None
            b["updatedAt"] = datetime.utcnow().isoformat()
            break
    
    save_user_data(user_id, data)
    
    messages = [m for m in data["messages"] if m["blockId"] == block_id]
    
    return {
        "blockId": block_id,
        "isFinalized": False,
        "messages": messages
    }

@app.delete("/api/block/{block_id}")
async def delete_block(block_id: str, user_id: str = Header(alias="authorization")):
    data = load_user_data(user_id)
    
    # Find all descendant blocks
    def get_descendants(bid):
        children = [b["blockId"] for b in data["blocks"] if b.get("parentBlockId") == bid]
        all_descendants = children.copy()
        for child in children:
            all_descendants.extend(get_descendants(child))
        return all_descendants
    
    deleted_ids = [block_id] + get_descendants(block_id)
    
    # Remove blocks, messages, and links
    data["blocks"] = [b for b in data["blocks"] if b["blockId"] not in deleted_ids]
    data["messages"] = [m for m in data["messages"] if m["blockId"] not in deleted_ids]
    data["blockLinks"] = [l for l in data["blockLinks"] if l["blockId"] not in deleted_ids]
    
    save_user_data(user_id, data)
    
    return {"success": True, "deletedBlockIds": deleted_ids}

@app.get("/api/map/{map_id}")
async def get_map(map_id: str, user_id: str = Header(alias="authorization")):
    data = load_user_data(user_id)
    
    # Find map
    map_obj = next((m for m in data["maps"] if m["mapId"] == map_id), None)
    if not map_obj:
        raise HTTPException(status_code=404, detail="Map not found")
    
    # Get blocks for this map
    blocks = [b for b in data["blocks"] if b["mapId"] == map_id]
    
    # Format blocks based on finalized status and root/child
    formatted_blocks = []
    for b in blocks:
        formatted = {
            "blockId": b["blockId"],
            "title": b["title"],
            "parentBlockId": b.get("parentBlockId"),
            "isFinalized": b["isFinalized"],
            "createdAt": b["createdAt"],
            "updatedAt": b["updatedAt"]
        }
        
        if b["isFinalized"]:
            formatted["summary"] = b["summary"]
            # Only include reformatted content for root blocks
            if not b.get("parentBlockId"):
                formatted["reformattedContent"] = b["reformattedContent"]
        
        formatted_blocks.append(formatted)
    
    return {
        "mapId": map_id,
        "title": map_obj["title"],
        "blocks": formatted_blocks
    }
