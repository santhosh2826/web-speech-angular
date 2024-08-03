import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { merge, Observable, of, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { defaultLanguage, languages } from '../shared/model/languages';
import { SpeechError } from '../shared/model/speech-error';
import { SpeechEvent } from '../shared/model/speech-event';
import { SpeechRecognizerService } from '../shared/services/web-apis/speech-recognizer.service';
import { ActionContext } from '../shared/services/actions/action-context';
import { SpeechNotification } from '../shared/model/speech-notification';
import { ApiserviceService } from '../apiservice.service';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'wsa-web-speech',
  templateUrl: './web-speech.component.html',
  styleUrls: ['./web-speech.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSpeechComponent implements OnInit {
  languages: string[] = languages;
  currentLanguage: string = defaultLanguage;
  totalTranscript?: string;

  transcript$?: Observable<string>;
  listening$?: Observable<boolean>;
  errorMessage$?: Observable<string>;
  defaultError$ = new Subject<string | undefined>();

  constructor(
    private speechRecognizer: SpeechRecognizerService,
    private actionContext: ActionContext,
    private apiService: ApiserviceService,
    private sanitizer: DomSanitizer
  ) {
    this.apiService
      .recordingFailed()
      .subscribe(() => (this.isRecording = false));
    this.apiService

      .getRecordedTime()
      .subscribe((time) => (this.recordedTime = time));
    this.apiService.getRecordedBlob().subscribe((data) => {
      this.teste = data;
      this.blobUrl = this.sanitizer.bypassSecurityTrustUrl(
        URL.createObjectURL(data.blob)
      );
    });
  }

  ngOnInit(): void {
    const webSpeechReady = this.speechRecognizer.initialize(this.currentLanguage);
    if (webSpeechReady) {
      this.initRecognition();
    } else {
      this.errorMessage$ = of('Your Browser is not supported. Please try Google Chrome.');
    }
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);
  }


  currentTime: string = '';
  private timeInterval: any;

  newTaskForm: boolean = false
  tempDescription!: string;
  tempName!: string;
  editMode: boolean = false;
  roleId!: number;
  sletter: boolean = true;
  sletter1: boolean = false;
  selectedTask!: any
  showSelectImg: boolean = true;
  previewUrls: string[] = [];
  stepStatus: boolean = false;
  editingStepId!: number
  selectedLogic: any
  taskStatus!: string
  isRecording: boolean = false;
  recordedTime: any
  blobUrl: any
  teste: any
  startr: boolean = true;
  end: boolean = false;
  record: boolean = false;
  wallpaperhide: boolean = true
  hole: boolean = true;
  showRemoveButton: boolean[] = [];
  savedFiles: { name: string, url: string }[] = [];
  currentSection: string = 'record'; // 'record' or 'saved'
  menuOpen: boolean = false; // Track menu open/close state
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private timer: any;

  click() {
    console.log('new')
    this.wallpaperhide = false;

  }

  start(): void {
    if (!this.isRecording) {
      this.isRecording = true;
      this.apiService.startRecording();
    }
    console.log('done');

    this.startr = false;
    this.end = true
    this.sletter = false
    this.sletter1 = true
    this.hole = false
    this.record = true
    if (this.speechRecognizer.isListening) {
      this.stop();
      return;
    }

    this.defaultError$.next(undefined);
    this.speechRecognizer.start();
  }

  stop(): void {
    if (this.isRecording) {
      this.apiService.stopRecording();
      this.isRecording = false;
    }
    this.startr = true;
    this.end = false
    this.sletter = false
    this.sletter1 = false
    this.record = false
    this.recordedTime = false
    this.speechRecognizer.stop();
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  updateTime(): void {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}`;
  }

  goBack(): void {
    this.wallpaperhide = true
  }


  selectLanguage(language: string): void {
    if (this.speechRecognizer.isListening) {
      this.stop();
    }
    this.currentLanguage = language;
    this.speechRecognizer.setLanguage(this.currentLanguage);
  }
  private initRecognition(): void {
    this.transcript$ = this.speechRecognizer.onResult().pipe(
      tap((notification) => {
        this.processNotification(notification);
      }),
      map((notification) => notification.content || '')
    );

    this.listening$ = merge(
      this.speechRecognizer.onStart(),
      this.speechRecognizer.onEnd()
    ).pipe(map((notification) => notification.event === SpeechEvent.Start));

    this.errorMessage$ = merge(
      this.speechRecognizer.onError(),
      this.defaultError$
    ).pipe(
      map((data) => {
        if (data === undefined) {
          return '';
        }
        if (typeof data === 'string') {
          return data;
        }
        let message;
        switch (data.error) {
          case SpeechError.NotAllowed:
            message = `Cannot run the demo.
            Your browser is not authorized to access your microphone.
            Verify that your browser has access to your microphone and try again.`;
            break;
          case SpeechError.NoSpeech:
            message = `No speech has been detected. Please try again.`;
            break;
          case SpeechError.AudioCapture:
            message = `Microphone is not available. Plese verify the connection of your microphone and try again.`;
            break;
          default:
            message = '';
            break;
        }
        return message;
      })
    );
  }

  private processNotification(notification: SpeechNotification<string>): void {
    if (notification.event === SpeechEvent.FinalContent) {
      const message = notification.content?.trim() || '';
      this.actionContext.processMessage(message, this.currentLanguage);
      // this.actionContext.runAction(message, this.currentLanguage);
      this.totalTranscript = this.totalTranscript
        ? `${this.totalTranscript}\n${message}`
        : notification.content;
    }
  }
}
