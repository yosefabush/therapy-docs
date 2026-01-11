import { VoiceRecording } from '@/types';
import { JsonRepository } from './base.repository';

class VoiceRecordingJsonRepository extends JsonRepository<VoiceRecording> {
  constructor() {
    super('voice-recordings.json');
  }

  async findBySession(sessionId: string): Promise<VoiceRecording[]> {
    return this.findMany(r => r.sessionId === sessionId);
  }

  async findByPatient(patientId: string): Promise<VoiceRecording[]> {
    return this.findMany(r => r.patientId === patientId);
  }

  protected generateId(): string {
    return `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const voiceRecordingRepository = new VoiceRecordingJsonRepository();
