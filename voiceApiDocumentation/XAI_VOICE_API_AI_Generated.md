# xAI Voice API Documentation

Complete API reference for xAI's voice capabilities including Text-to-Speech (TTS), Speech-to-Text (STT), and Realtime Voice interactions.

**Base URL:** `https://api.x.ai/v1`  
**WebSocket URL:** `wss://api.x.ai/v1`

---

## Table of Contents

- [Authentication](#authentication)
- [Available Voices](#available-voices)
- [Audio Formats](#audio-formats)
- [Text-to-Speech (TTS)](#text-to-speech-tts)
  - [REST API](#tts-rest-api)
  - [Streaming WebSocket](#tts-streaming-websocket)
- [Speech-to-Text (STT)](#speech-to-text-stt)
  - [REST API](#stt-rest-api)
  - [Streaming WebSocket](#stt-streaming-websocket)
- [Realtime Voice API](#realtime-voice-api)
  - [Ephemeral Tokens](#ephemeral-tokens)
  - [WebSocket Connection](#websocket-connection)
  - [Session Configuration](#session-configuration)
  - [Client → Server Messages](#client--server-messages)
  - [Server → Client Messages](#server--client-messages)
- [Code Examples](#code-examples)

---

## Authentication

All API requests require authentication via Bearer token in the `Authorization` header.

```
Authorization: Bearer YOUR_XAI_API_KEY
```

For browser-based realtime connections, use [ephemeral tokens](#ephemeral-tokens) to avoid exposing your API key.

---

## Available Voices

| Voice ID | Description |
|----------|-------------|
| `ara`    | Female voice (default) |
| `rex`    | Male voice |
| `sal`    | Neutral voice |
| `eve`    | Female voice |
| `una`    | Female voice |
| `leo`    | Male voice |

Voice IDs are case-insensitive (`Ara`, `ara`, `ARA` all work).

---

## Audio Formats

### PCM (Pulse Code Modulation)

| Format | MIME Type | Sample Rate | Bit Depth | Channels | Use Case |
|--------|-----------|-------------|-----------|----------|----------|
| PCM Linear16 | `audio/pcm` | 16000 Hz | 16-bit | Mono | STT input |
| PCM Linear16 | `audio/pcm` | 24000 Hz | 16-bit | Mono | TTS output, Realtime |

### μ-law (PCMU)

| Format | MIME Type | Sample Rate | Use Case |
|--------|-----------|-------------|----------|
| μ-law | `audio/pcmu` | 8000 Hz | Telephony (Twilio) |

### Compressed Formats (TTS REST only)

| Format | Extension |
|--------|-----------|
| MP3 | `.mp3` |
| WAV | `.wav` |

---

## Text-to-Speech (TTS)

### TTS REST API

Convert text to speech audio.

**Endpoint:** `POST /audio/speech`

#### Request

```http
POST https://api.x.ai/v1/audio/speech
Authorization: Bearer YOUR_XAI_API_KEY
Content-Type: application/json

{
  "input": "Hello, how are you today?",
  "voice": "ara",
  "response_format": "mp3"
}
```

#### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `input` | string | Yes | — | Text to convert to speech |
| `voice` | string | No | `ara` | Voice ID to use |
| `response_format` | string | No | `mp3` | Output format: `mp3` or `wav` |

#### Response

Returns binary audio data with appropriate `Content-Type` header.

#### Example (Node.js)

```javascript
const response = await fetch("https://api.x.ai/v1/audio/speech", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${XAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    input: "Hello, how are you today?",
    voice: "ara",
    response_format: "mp3",
  }),
});

const audioBuffer = await response.arrayBuffer();
fs.writeFileSync("output.mp3", Buffer.from(audioBuffer));
```

#### Example (Python)

```python
import requests

response = requests.post(
    "https://api.x.ai/v1/audio/speech",
    headers={
        "Authorization": f"Bearer {XAI_API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "input": "Hello, how are you today?",
        "voice": "ara",
        "response_format": "mp3",
    },
)

with open("output.mp3", "wb") as f:
    f.write(response.content)
```

#### Example (cURL)

```bash
curl -X POST "https://api.x.ai/v1/audio/speech" \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello!", "voice": "ara", "response_format": "mp3"}' \
  --output output.mp3
```

---

### TTS Streaming WebSocket

Stream text-to-speech for real-time audio generation.

**Endpoint:** `wss://api.x.ai/v1/realtime/audio/speech`

#### Connection

```javascript
const ws = new WebSocket("wss://api.x.ai/v1/realtime/audio/speech", {
  headers: {
    "Authorization": `Bearer ${XAI_API_KEY}`,
  },
});
```

#### Client → Server Messages

**Config Message** (send first)

```json
{
  "type": "config",
  "data": {
    "voice_id": "ara"
  }
}
```

**Text Chunk Message**

```json
{
  "type": "text_chunk",
  "data": {
    "text": "Hello, how are you today?",
    "is_last": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Text to convert |
| `is_last` | boolean | `true` if this is the final chunk |

#### Server → Client Messages

**Audio Response**

```json
{
  "data": {
    "data": {
      "audio": "BASE64_ENCODED_PCM_AUDIO",
      "is_last": false
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `audio` | string | Base64-encoded PCM audio (24kHz, 16-bit, mono) |
| `is_last` | boolean | `true` if this is the final audio chunk |

#### Example (Node.js)

```javascript
import WebSocket from "ws";

const ws = new WebSocket("wss://api.x.ai/v1/realtime/audio/speech", {
  headers: { "Authorization": `Bearer ${XAI_API_KEY}` },
});

const audioChunks = [];

ws.on("open", () => {
  // Send config
  ws.send(JSON.stringify({
    type: "config",
    data: { voice_id: "ara" },
  }));

  // Send text
  ws.send(JSON.stringify({
    type: "text_chunk",
    data: { text: "Hello, how are you?", is_last: true },
  }));
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  const audioB64 = message.data.data.audio;
  const isLast = message.data.data.is_last;

  audioChunks.push(Buffer.from(audioB64, "base64"));

  if (isLast) {
    const fullAudio = Buffer.concat(audioChunks);
    // fullAudio is PCM: 24kHz, 16-bit, mono
    ws.close();
  }
});
```

---

## Speech-to-Text (STT)

### STT REST API

Transcribe audio files to text.

**Endpoint:** `POST /audio/transcriptions`

#### Request

```http
POST https://api.x.ai/v1/audio/transcriptions
Authorization: Bearer YOUR_XAI_API_KEY
Content-Type: multipart/form-data

file: <audio_file>
```

#### Supported Audio Formats

- MP3 (`.mp3`)
- WAV (`.wav`)
- Mono or stereo

#### Response

```json
{
  "text": "Hello, how are you today?"
}
```

#### Example (Node.js)

```javascript
import FormData from "form-data";
import axios from "axios";
import fs from "fs";

const formData = new FormData();
formData.append("file", fs.createReadStream("audio.mp3"), {
  filename: "audio.mp3",
  contentType: "audio/mpeg",
});

const response = await axios.post(
  "https://api.x.ai/v1/audio/transcriptions",
  formData,
  {
    headers: {
      "Authorization": `Bearer ${XAI_API_KEY}`,
      ...formData.getHeaders(),
    },
  }
);

console.log(response.data.text);
```

#### Example (Python)

```python
import requests

with open("audio.mp3", "rb") as f:
    response = requests.post(
        "https://api.x.ai/v1/audio/transcriptions",
        headers={"Authorization": f"Bearer {XAI_API_KEY}"},
        files={"file": ("audio.mp3", f, "audio/mpeg")},
    )

print(response.json()["text"])
```

#### Example (cURL)

```bash
curl -X POST "https://api.x.ai/v1/audio/transcriptions" \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -F "file=@audio.mp3"
```

---

### STT Streaming WebSocket

Stream audio for real-time transcription.

**Endpoint:** `wss://api.x.ai/v1/realtime/audio/transcriptions`

#### Connection

```javascript
const ws = new WebSocket("wss://api.x.ai/v1/realtime/audio/transcriptions", {
  headers: {
    "Authorization": `Bearer ${XAI_API_KEY}`,
  },
});
```

#### Client → Server Messages

**Config Message** (send first)

```json
{
  "type": "config",
  "data": {
    "encoding": "linear16",
    "sample_rate_hertz": 16000,
    "enable_interim_results": true
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `encoding` | string | Yes | Audio encoding: `linear16` |
| `sample_rate_hertz` | number | Yes | Sample rate in Hz (e.g., `16000`) |
| `enable_interim_results` | boolean | No | Enable partial transcripts |

**Audio Message**

```json
{
  "type": "audio",
  "data": {
    "audio": "BASE64_ENCODED_PCM_AUDIO"
  }
}
```

#### Server → Client Messages

**Transcript Response**

```json
{
  "data": {
    "type": "speech_recognized",
    "data": {
      "transcript": "Hello how are you",
      "is_final": false
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `transcript` | string | Recognized text |
| `is_final` | boolean | `true` for final transcript, `false` for interim |

#### Example (Node.js)

```javascript
import WebSocket from "ws";

const ws = new WebSocket("wss://api.x.ai/v1/realtime/audio/transcriptions", {
  headers: { "Authorization": `Bearer ${XAI_API_KEY}` },
});

ws.on("open", () => {
  // Send config
  ws.send(JSON.stringify({
    type: "config",
    data: {
      encoding: "linear16",
      sample_rate_hertz: 16000,
      enable_interim_results: true,
    },
  }));

  // Stream audio chunks (from microphone, file, etc.)
  streamAudioChunks((chunk) => {
    ws.send(JSON.stringify({
      type: "audio",
      data: { audio: chunk.toString("base64") },
    }));
  });
});

ws.on("message", (data) => {
  const message = JSON.parse(data.toString());
  if (message.data?.type === "speech_recognized") {
    const { transcript, is_final } = message.data.data;
    if (is_final) {
      console.log("Final:", transcript);
    } else {
      console.log("Interim:", transcript);
    }
  }
});
```

---

## Realtime Voice API

Bidirectional voice conversations with AI. Supports voice input, voice output, and text.

**Endpoint:** `wss://api.x.ai/v1/realtime`

---

### Ephemeral Tokens

For browser clients, use ephemeral tokens instead of exposing your API key.

**Endpoint:** `POST /realtime/client_secrets`

#### Request

```http
POST https://api.x.ai/v1/realtime/client_secrets
Authorization: Bearer YOUR_XAI_API_KEY
Content-Type: application/json

{
  "expires_after": {
    "seconds": 300
  }
}
```

#### Response

```json
{
  "value": "ephemeral_token_here",
  "expires_at": 1699999999
}
```

| Field | Type | Description |
|-------|------|-------------|
| `value` | string | Ephemeral token for client use |
| `expires_at` | number | Unix timestamp when token expires |

#### Example (Node.js Backend)

```javascript
app.post("/session", async (req, res) => {
  const response = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { seconds: 300 },
    }),
  });

  const data = await response.json();
  res.json({
    client_secret: {
      value: data.value,
      expires_at: data.expires_at,
    },
  });
});
```

---

### WebSocket Connection

#### Server-Side Connection (Node.js)

```javascript
import WebSocket from "ws";

const ws = new WebSocket("wss://api.x.ai/v1/realtime", {
  headers: {
    "Authorization": `Bearer ${XAI_API_KEY}`,
    "Content-Type": "application/json",
  },
});
```

#### Browser Connection (with Ephemeral Token)

```javascript
const ws = new WebSocket("wss://api.x.ai/v1/realtime", [
  "realtime",
  `openai-insecure-api-key.${ephemeralToken}`,
  "openai-beta.realtime-v1",
]);
```

---

### Session Configuration

After connecting, wait for `conversation.created` then send session configuration.

#### session.update

```json
{
  "type": "session.update",
  "session": {
    "instructions": "You are a helpful voice assistant. Keep responses concise.",
    "voice": "ara",
    "audio": {
      "input": {
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        }
      },
      "output": {
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        }
      }
    },
    "turn_detection": {
      "type": "server_vad"
    }
  }
}
```

#### Session Fields

| Field | Type | Description |
|-------|------|-------------|
| `instructions` | string | System prompt for the AI |
| `voice` | string | Voice ID for responses |
| `audio.input.format.type` | string | Input audio format: `audio/pcm` or `audio/pcmu` |
| `audio.input.format.rate` | number | Input sample rate in Hz |
| `audio.output.format.type` | string | Output audio format |
| `audio.output.format.rate` | number | Output sample rate in Hz |
| `turn_detection.type` | string | `server_vad` for server-side voice activity detection |

#### Audio Format Options

| Format | Type | Rate | Use Case |
|--------|------|------|----------|
| PCM | `audio/pcm` | 16000-24000 | Web clients |
| μ-law | `audio/pcmu` | 8000 | Telephony (Twilio) |

---

### Client → Server Messages

#### input_audio_buffer.append

Stream audio to the conversation.

```json
{
  "type": "input_audio_buffer.append",
  "audio": "BASE64_ENCODED_AUDIO"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `audio` | string | Base64-encoded audio matching configured format |

#### input_audio_buffer.commit

Commit the audio buffer (used with manual VAD).

```json
{
  "type": "input_audio_buffer.commit"
}
```

#### conversation.item.create

Send a text message to the conversation.

```json
{
  "type": "conversation.item.create",
  "item": {
    "type": "message",
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Hello, how are you?"
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `item.type` | string | Always `message` |
| `item.role` | string | `user` or `assistant` |
| `item.content[].type` | string | `input_text` for text input |
| `item.content[].text` | string | The text content |

#### response.create

Request the AI to generate a response.

```json
{
  "type": "response.create"
}
```

---

### Server → Client Messages

#### conversation.created

Sent when WebSocket connection is established.

```json
{
  "type": "conversation.created",
  "conversation": {
    "id": "conv_abc123"
  }
}
```

#### session.updated

Confirms session configuration was applied.

```json
{
  "type": "session.updated",
  "session": {
    "voice": "ara",
    "instructions": "...",
    "audio": { ... }
  }
}
```

#### input_audio_buffer.speech_started

Server VAD detected user started speaking.

```json
{
  "type": "input_audio_buffer.speech_started",
  "audio_start_ms": 1234
}
```

#### input_audio_buffer.speech_stopped

Server VAD detected user stopped speaking.

```json
{
  "type": "input_audio_buffer.speech_stopped",
  "audio_end_ms": 5678
}
```

#### input_audio_buffer.committed

Audio buffer was committed for processing.

```json
{
  "type": "input_audio_buffer.committed",
  "item_id": "item_abc123"
}
```

#### response.created

AI started generating a response.

```json
{
  "type": "response.created",
  "response": {
    "id": "resp_abc123"
  }
}
```

#### response.output_audio.delta

Audio chunk from AI response.

```json
{
  "type": "response.output_audio.delta",
  "delta": "BASE64_ENCODED_AUDIO"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `delta` | string | Base64-encoded audio chunk |

#### response.output_audio_transcript.delta

Transcript of AI's spoken response.

```json
{
  "type": "response.output_audio_transcript.delta",
  "delta": "Hello, how can I"
}
```

#### response.output_audio.done

AI finished sending audio.

```json
{
  "type": "response.output_audio.done"
}
```

#### response.output_audio_transcript.done

AI finished sending transcript.

```json
{
  "type": "response.output_audio_transcript.done",
  "transcript": "Hello, how can I help you today?"
}
```

#### response.done

AI finished generating the response.

```json
{
  "type": "response.done",
  "response": {
    "id": "resp_abc123",
    "status": "completed"
  }
}
```

#### error

An error occurred.

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_audio_format",
    "message": "Audio format does not match session configuration"
  }
}
```

---

## Code Examples

### Complete Realtime Voice Client (Node.js)

```javascript
import WebSocket from "ws";

const XAI_API_KEY = process.env.XAI_API_KEY;

async function startVoiceSession() {
  const ws = new WebSocket("wss://api.x.ai/v1/realtime", {
    headers: {
      "Authorization": `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  let isConfigured = false;

  ws.on("open", () => {
    console.log("Connected to xAI Realtime API");
  });

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "conversation.created":
        // Configure session
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: "You are a helpful assistant.",
            voice: "ara",
            audio: {
              input: { format: { type: "audio/pcm", rate: 24000 } },
              output: { format: { type: "audio/pcm", rate: 24000 } },
            },
            turn_detection: { type: "server_vad" },
          },
        }));
        break;

      case "session.updated":
        isConfigured = true;
        console.log("Session configured, ready for audio");
        
        // Send initial greeting request
        ws.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Say hello!" }],
          },
        }));
        ws.send(JSON.stringify({ type: "response.create" }));
        break;

      case "response.output_audio.delta":
        // Handle audio chunk (base64 PCM)
        const audioBuffer = Buffer.from(message.delta, "base64");
        // Play or process audio...
        break;

      case "response.output_audio_transcript.delta":
        process.stdout.write(message.delta);
        break;

      case "input_audio_buffer.speech_started":
        console.log("\n[User speaking...]");
        break;

      case "response.done":
        console.log("\n[Response complete]");
        break;

      case "error":
        console.error("Error:", message.error);
        break;
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", (code, reason) => {
    console.log(`Disconnected: ${code} - ${reason}`);
  });

  return ws;
}

startVoiceSession();
```

### Browser Client with Ephemeral Token

```javascript
async function connectToVoice() {
  // Get ephemeral token from your backend
  const sessionRes = await fetch("/api/session", { method: "POST" });
  const { client_secret, voice, instructions } = await sessionRes.json();

  // Connect to xAI with ephemeral token
  const ws = new WebSocket("wss://api.x.ai/v1/realtime", [
    "realtime",
    `openai-insecure-api-key.${client_secret.value}`,
    "openai-beta.realtime-v1",
  ]);

  // Set up audio context for playback
  const audioContext = new AudioContext({ sampleRate: 24000 });
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === "response.output_audio.delta") {
      // Decode and play audio
      const audioData = atob(message.delta);
      // Convert to AudioBuffer and play...
    }
  };

  // Capture microphone and send audio
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  
  mediaRecorder.ondataavailable = (event) => {
    // Convert to PCM and send
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(reader.result)));
      ws.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: base64,
      }));
    };
    reader.readAsArrayBuffer(event.data);
  };

  return ws;
}
```

### Telephony Integration (Twilio)

```javascript
// Use PCMU format for telephony
const sessionConfig = {
  type: "session.update",
  session: {
    instructions: "You are a phone assistant.",
    voice: "ara",
    audio: {
      input: { format: { type: "audio/pcmu" } },  // 8kHz μ-law
      output: { format: { type: "audio/pcmu" } },
    },
    turn_detection: { type: "server_vad" },
  },
};

// Twilio sends μ-law audio - pass directly to xAI
twilioWs.on("media", (msg) => {
  xaiWs.send(JSON.stringify({
    type: "input_audio_buffer.append",
    audio: msg.media.payload,  // Already base64 μ-law
  }));
});

// xAI returns μ-law audio - pass directly to Twilio
xaiWs.on("message", (data) => {
  const message = JSON.parse(data);
  if (message.type === "response.output_audio.delta") {
    twilioWs.send(JSON.stringify({
      event: "media",
      media: { payload: message.delta },  // Already base64 μ-law
      streamSid: streamSid,
    }));
  }
});
```

---

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `invalid_request_error` | Malformed request |
| `invalid_audio_format` | Audio format doesn't match session config |
| `rate_limit_exceeded` | Too many requests |
| `authentication_error` | Invalid or expired API key/token |
| `server_error` | Internal server error |

### Best Practices

1. **Wait for `session.updated`** before sending audio
2. **Match audio format** to session configuration exactly
3. **Handle reconnection** gracefully for long sessions
4. **Use ephemeral tokens** for browser clients (5 min expiry)
5. **Implement VAD** or use `server_vad` for turn detection

---

## Rate Limits

Contact xAI for current rate limit information for your API tier.

---

## Changelog

- Initial documentation based on xAI Voice API examples

