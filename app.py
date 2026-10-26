from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
import os
import random

load_dotenv()

app = FastAPI()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_URLS",
        "http://localhost:3000,http://localhost:3001",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Initialize Spotify client
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=os.getenv('SPOTIFY_CLIENT_ID'),
    client_secret=os.getenv('SPOTIFY_CLIENT_SECRET')
))

class PlaylistRequest(BaseModel):
    prompt: str
    bpm_range: List[int]
    explicit: bool

class Track(BaseModel):
    id: str
    name: str
    artist: str
    bpm: int
    explicit: bool

class PlaylistResponse(BaseModel):
    tracks: List[Track]

@app.post("/generate-playlist", response_model=PlaylistResponse)
async def generate_playlist(request: PlaylistRequest):
    try:
        # Search for tracks based on prompt
        results = sp.search(q=request.prompt, type='track', limit=50)
        
        # Filter tracks based on BPM and explicit content
        filtered_tracks = []
        for item in results['tracks']['items']:
            track_features = sp.audio_features(item['id'])[0]
            if track_features:
                track_bpm = int(track_features['tempo'])
                if (request.bpm_range[0] <= track_bpm <= request.bpm_range[1] and 
                    item['explicit'] == request.explicit):
                    filtered_tracks.append({
                        'id': item['id'],
                        'name': item['name'],
                        'artist': item['artists'][0]['name'],
                        'bpm': track_bpm,
                        'explicit': item['explicit']
                    })
        
        # Sort tracks by BPM for smooth mixing
        filtered_tracks.sort(key=lambda x: x['bpm'])
        
        return PlaylistResponse(tracks=filtered_tracks)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
