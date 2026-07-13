import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FriendPresence } from '@/shared/models/friends.model';

@Injectable({
  providedIn: 'root'
})
export class MonitoredCardService {
  private monitoredCardSubject = new BehaviorSubject<FriendPresence | null>(null);
  private centerRequestedSubject = new Subject<FriendPresence>();

  monitoredCard$ = this.monitoredCardSubject.asObservable();
  centerRequested$ = this.centerRequestedSubject.asObservable();

  constructor() {
    const saved = sessionStorage.getItem('rastreador_monitored_card');
    if (saved) {
      try {
        const card = JSON.parse(saved);
        this.monitoredCardSubject.next(card);
      } catch (e) {}
    }
  }

  get monitoredCardValue(): FriendPresence | null {
    return this.monitoredCardSubject.value;
  }

  monitorCard(card: FriendPresence | null): void {
    this.monitoredCardSubject.next(card);
    if (card) {
      sessionStorage.setItem('rastreador_monitored_card', JSON.stringify(card));
      this.requestCenter();
    } else {
      sessionStorage.removeItem('rastreador_monitored_card');
    }
  }

  clearMonitoredCard(): void {
    this.monitoredCardSubject.next(null);
    sessionStorage.removeItem('rastreador_monitored_card');
  }

  requestCenter(): void {
    const card = this.monitoredCardSubject.value;
    if (card) {
      this.centerRequestedSubject.next(card);
    }
  }
}
