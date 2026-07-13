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

  get monitoredCardValue(): FriendPresence | null {
    return this.monitoredCardSubject.value;
  }

  monitorCard(card: FriendPresence | null): void {
    this.monitoredCardSubject.next(card);
    if (card) {
      this.requestCenter();
    }
  }

  clearMonitoredCard(): void {
    this.monitoredCardSubject.next(null);
  }

  requestCenter(): void {
    const card = this.monitoredCardSubject.value;
    if (card) {
      this.centerRequestedSubject.next(card);
    }
  }
}
