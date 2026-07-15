import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type CallState = 'IDLE' | 'RINGING' | 'IN_CALL' | 'OUTGOING';

export interface CallInfo {
  deviceId: string;
  userName?: string;
  direction: 'incoming' | 'outgoing';
}

@Injectable({
  providedIn: 'root'
})
export class AudioCallService {
  private callStateSubject = new BehaviorSubject<CallState>('IDLE');
  public callState$: Observable<CallState> = this.callStateSubject.asObservable();

  private callInfoSubject = new BehaviorSubject<CallInfo | null>(null);
  public callInfo$: Observable<CallInfo | null> = this.callInfoSubject.asObservable();

  constructor() {}

  public get currentState(): CallState {
    return this.callStateSubject.value;
  }

  public get currentCallInfo(): CallInfo | null {
    return this.callInfoSubject.value;
  }

  public startOutgoingCall(deviceId: string, userName?: string): void {
    if (this.currentState !== 'IDLE') return;
    this.callInfoSubject.next({ deviceId, userName, direction: 'outgoing' });
    this.callStateSubject.next('OUTGOING');
  }

  public receiveIncomingCall(deviceId: string, userName?: string): void {
    if (this.currentState !== 'IDLE') return;
    this.callInfoSubject.next({ deviceId, userName, direction: 'incoming' });
    this.callStateSubject.next('RINGING');
  }

  public acceptCall(): void {
    if (this.currentState === 'RINGING' || this.currentState === 'OUTGOING') {
      this.callStateSubject.next('IN_CALL');
    }
  }

  public endCall(): void {
    this.callStateSubject.next('IDLE');
    this.callInfoSubject.next(null);
  }
}
