import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Card, CardContent, Grid, Slider, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious } from '@mui/icons-material';
import ReactAudioPlayer from 'react-audio-player';

function App() {
  const [prompt, setPrompt] = useState('');
  const [bpmRange, setBpmRange] = useState([118, 120]);
  const [explicit, setExplicit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playing, setPlaying] = useState(false);

  const handleGeneratePlaylist = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/generate-playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, bpm_range: bpmRange, explicit }) });
      const data = await response.json();
      setTracks(data.tracks);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };
  const handlePlay = () => { if (tracks.length > 0) { setCurrentTrack(tracks[0]); setPlaying(true); } };
  const handleNext = () => { const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id); if (currentIndex < tracks.length - 1) setCurrentTrack(tracks[currentIndex + 1]); };
  const handlePrevious = () => { const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id); if (currentIndex > 0) setCurrentTrack(tracks[currentIndex - 1]); };

  return <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
    <Typography variant="h4" component="h1" gutterBottom>AI DJ Assistant</Typography>
    <Box sx={{ mb: 4 }}>
      <TextField fullWidth label="Playlist Prompt" variant="outlined" value={prompt} onChange={e => setPrompt(e.target.value)} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><Typography sx={{ mr: 2 }}>BPM Range:</Typography><Slider value={bpmRange} onChange={(e, newValue) => setBpmRange(newValue)} min={60} max={200} step={1} /></Box>
      <FormControl fullWidth sx={{ mb: 2 }}><InputLabel>Explicit Content</InputLabel><Select value={explicit ? 'yes' : 'no'} onChange={e => setExplicit(e.target.value === 'yes')}><MenuItem value="no">No (Clean Only)</MenuItem><MenuItem value="yes">Yes</MenuItem></Select></FormControl>
      <Button variant="contained" color="primary" onClick={handleGeneratePlaylist} disabled={loading} fullWidth>{loading ? <CircularProgress size={24} /> : 'Generate Playlist'}</Button>
    </Box>
    <Grid container spacing={3}>{tracks.map((track, index) => <Grid item xs={12} sm={6} md={4} key={track.id}><Card><CardContent><Typography variant="h6" component="div">{track.name}</Typography><Typography color="text.secondary">{track.artist}</Typography><Typography color="text.secondary">BPM: {track.bpm}</Typography>{currentTrack?.id === track.id && <div><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Button startIcon={<SkipPrevious />} onClick={handlePrevious} disabled={index === 0}>Previous</Button><Button startIcon={playing ? <Pause /> : <PlayArrow />} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</Button><Button startIcon={<SkipNext />} onClick={handleNext} disabled={index === tracks.length - 1}>Next</Button></Box><ReactAudioPlayer src={'https://open.spotify.com/track/' + track.id} controls playing={playing} /></div>}</CardContent></Card></Grid>)}</Grid>
  </Box>;
}
export default App;
