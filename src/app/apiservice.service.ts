import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';
import * as RecordRTC from 'recordrtc';
import * as moment from 'moment';
interface RecordedAudioOutput {
  blob: Blob;
  title: string;
}
@Injectable({
  providedIn: 'root'
})
export class ApiserviceService {

  private stream: any
  private recorder: any
  private interval: any
  private startTime: any
  private _recorded = new Subject<RecordedAudioOutput>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();
  private baseUrl = 'https://your-api-url.com'
  getRecordedBlob(): Observable<RecordedAudioOutput> {
    return this._recorded.asObservable();
  }

  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }

  startRecording() {
    if (this.recorder) {
      // It means recording is already started or it is already recording something
      return;
    }


    this._recordingTime.next('00:00');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        this.stream = s;
        this.record();
      })
      .catch((error) => {
        this._recordingFailed.next('an error occurs');
      });
  }

  constructor(private http: HttpClient) { }
  abortRecording() {
    this.stopMedia();
  }

  private record() {
    this.recorder = new RecordRTC.StereoAudioRecorder(this.stream, {
      type: 'audio',
      mimeType: 'audio/webm',
    });


    this.recorder.record();
    this.startTime = moment();
    this.interval = setInterval(() => {
      const currentTime = moment();
      const diffTime = moment.duration(currentTime.diff(this.startTime));
      const time =
        this.toString(diffTime.minutes()) +
        ':' +
        this.toString(diffTime.seconds());
      this._recordingTime.next(time);
    }, 1000);
  }

  private toString(value: number): string {
    let val = value;
    if (!value) val = 0;
    // if (value < 10) val = '0' + value;
    if (value < 10) val = 0 + value
    return val.toString();
  }
  applyHeroVoiceEffect(formData: FormData) {
    return this.http.post<any>(`${this.baseUrl}/apply-hero-voice`, formData);
  }

  stopRecording() {
    if (this.recorder) {
      this.recorder.stop(
        (blob: Blob) => {
          if (this.startTime) {
            const mp3Name = encodeURIComponent(
              'audio_' + new Date().getTime() + '.mp3'
            );
            this.stopMedia();
            this._recorded.next({ blob: blob, title: mp3Name });
          }
        },
        () => {
          this.stopMedia();
          this._recordingFailed.next('an error occurs');
        }
      );
    }
  }

  private stopMedia() {
    if (this.recorder) {
      this.recorder = null;
      clearInterval(this.interval);
      this.startTime = null;
      if (this.stream) {
        // this.stream.getAudioTracks().forEach(track => track.stop());
        this.stream.getAudioTracks().forEach((track: MediaStreamTrack) => track.stop());
        this.stream = null;
      }
    }
  }
}
