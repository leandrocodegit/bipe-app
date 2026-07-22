import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type CallState = 'IDLE' | 'RINGING' | 'IN_CALL' | 'OUTGOING' | 'BIPE' | 'BIPE_WAITE';

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

  private bipeSubject = new BehaviorSubject<CallState>('IDLE');
  public bipeState$: Observable<CallState> = this.bipeSubject.asObservable();

  private callInfoSubject = new BehaviorSubject<CallInfo | null>(null);
  public callInfo$: Observable<CallInfo | null> = this.callInfoSubject.asObservable();

  constructor() { }

  public get currentState(): CallState {
    return this.callStateSubject.value;
  }

  public get currentStateBipe(): CallState {
    return this.bipeSubject.value;
  }

  public get currentCallInfo(): CallInfo | null {
    return this.callInfoSubject.value;
  }

  public sendBipe(deviceId: string, userName?: string): void {
    console.log('AudioCallService.sendBipe chamado com:', deviceId, userName);
    this.callInfoSubject.next({ deviceId, userName, direction: 'outgoing' });
    this.bipeSubject.next('BIPE');
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
    this.bipeSubject.next('IDLE');
    this.callInfoSubject.next(null);
  }
}
