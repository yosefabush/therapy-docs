# Voice Recording Feature Implementation Plan

## Overview
Add voice recording functionality to therapy sessions with playback on patient detail page.

---

## Files to Create

### 1. Data Layer
**`src/lib/data/repositories/voice-recording.repository.ts`**
- CRUD operations for voice recordings
- `findBySession(sessionId)` and `findByPatient(patientId)` methods

### 2. API Routes
**`src/app/api/voice-recordings/route.ts`**
- GET: List recordings (filter by sessionId or patientId)
- POST: Create new recording

**`src/app/api/voice-recordings/[id]/route.ts`**
- GET: Single recording
- DELETE: Remove recording

### 3. Client Hook
**`src/lib/hooks/use-voice-recordings.ts`**
- Fetch, create, delete operations
- Filter by sessionId or patientId

### 4. UI Components
**`src/components/recordings/VoiceRecorder.tsx`**
- Web Audio API / MediaRecorder for browser recording
- Start/pause/stop controls
- Audio preview before saving
- Consent checkbox (HIPAA)
- Saves as base64 to JSON store

**`src/components/recordings/AudioPlayer.tsx`**
- Play/pause button with progress bar
- Duration display
- Delete button

**`src/components/recordings/RecordingsList.tsx`**
- Groups recordings by session
- Shows transcription status badge
- Displays transcript if available

**`src/components/recordings/index.ts`**
- Barrel exports

---

## Files to Modify

### 1. Types
**`src/types/index.ts`**
- Add `patientId: string` to `VoiceRecording` interface

### 2. Repository Exports
**`src/lib/data/repositories/index.ts`**
- Export `voiceRecordingRepository`

### 3. Hook Exports
**`src/lib/hooks/index.ts`**
- Export `useVoiceRecordings`

### 4. Session Form
**`src/components/sessions/SessionForm.tsx`**
- Replace simulated VoiceRecorder (lines 400-492) with real component
- Add `sessionId` and `patientId` props
- Connect to `useVoiceRecordings` hook for saving

### 5. Patient Detail Page
**`src/app/patients/[id]/page.tsx`**
- Add "הקלטות" (Recordings) tab
- Fetch recordings with `useVoiceRecordings({ patientId })`
- Render `RecordingsList` component

### 6. Seed Data
**`src/lib/data/seed.ts`**
- Initialize empty `voice-recordings.json`

---

## Implementation Order

1. Update `VoiceRecording` type (add patientId)
2. Create repository + export
3. Create API routes
4. Create hook + export
5. Create VoiceRecorder component
6. Create AudioPlayer component
7. Create RecordingsList component
8. Update SessionForm to use real recorder
9. Add recordings tab to patient page
10. Update seed file

---

## Technical Notes

- **Audio format**: `audio/webm;codecs=opus` (Chrome/Firefox), fallback needed for Safari
- **Storage**: Base64 in JSON (demo app) - production would use file/cloud storage
- **Transcription**: Status field ready for future AI integration (shows as badge)

---

## VoiceRecording Type (Updated)

```typescript
export interface VoiceRecording {
  id: string;
  sessionId: string;
  patientId: string;  // NEW - for easier patient-level queries
  duration: number;
  encryptedAudioUrl: string;  // Will store base64 audio data
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  encryptedTranscript?: string;
  consentObtained: boolean;
  createdAt: Date;
}
```

---

## Future Enhancements

1. **AI Transcription**: Integrate speech-to-text API to auto-transcribe recordings
2. **Cloud Storage**: Move from base64/JSON to S3/Azure Blob for production
3. **Encryption**: Implement actual audio encryption for HIPAA compliance
4. **Waveform Visualization**: Add audio waveform display during recording/playback
