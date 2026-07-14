import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FriendPresence } from '@/shared/models/friends.model';

@Injectable({
  providedIn: 'root'
})
export class MonitoredCardService {
  private monitoredCardSubject = new BehaviorSubject<FriendPresence | null>(null);
  private centerRequestedSubject = new Subject<FriendPresence>();
  private mapReadySubject = new BehaviorSubject<boolean>(false);
  mapReady$ = this.mapReadySubject.asObservable();

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

  /**
   * Request the map to center on the currently monitored card.
   * Only emits when the map has been registered as ready.
   */
  requestCenter(): void {
    const card = this.monitoredCardSubject.value;
    if (!card) return;
    if (!this.mapReadySubject.value) {
      // Ignore requests made before the map is initialized
      return;
    }
    this.centerRequestedSubject.next(card);
  }

  /** Called by the map component to inform the service that the map is ready */
  setMapReady(ready: boolean): void {
    this.mapReadySubject.next(!!ready);
  }
}
