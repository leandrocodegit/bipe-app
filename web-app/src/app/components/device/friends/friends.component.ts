import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import {
  BatteryInfo,
  batteryInfo,
  matchRegisteredRegions,
  MotionInfo,
  relativeTime,
  topMotionActivity,
} from '@/shared/GeoUtil';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { MqttService, IMqttMessage, MqttConnectionState } from 'ngx-mqtt';
import { LayoutService } from '@/shared/services/layout.service';
import { Subscription, take } from 'rxjs';
import { FriendCard, FriendPresence, OwnTracksLocation, Region } from '@/shared/models/friends.model';
import { Device } from '@/shared/models/device.model';
import { MqttConnectionService } from '@/core/auth/services/mqtt.service';
import { AuthService } from '@/core/auth/services/auth.service';
import { MonitoredCardService } from '@/shared/services/monitored-card.service';
import { Transition, TransitionTimelineComponent } from '@/shared/components/transition-timeline/transition-timeline.component';
import { RecorderService } from '@/shared/services/recorder.service';


@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TooltipModule,
    TransitionTimelineComponent
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
})
export class FriendsComponent implements OnInit, OnDestroy {

  friends: FriendPresence[] = [];
  @Input() registeredRegions: Region[] = [];
  @Input() addressById: Record<string, string> = {};

  @Output() friendSelected = new EventEmitter<FriendPresence>();
  @Output() refresh = new EventEmitter<void>();
  @Output() locateAddress = new EventEmitter<{ id: string; lat: number; lon: number }>();

  searchTerm = '';
  selectedFriend: FriendPresence | null = null;
  copied = false;
  loading = true;
  justArrivedIds = new Set<string>();


  private mqttSubscription?: Subscription;
  protected minhaListaDeTransicoes: Transition[] = [];
  private presenceByTid = new Map<string, FriendPresence>();

  private tidByTopic = new Map<string, string>();
  private isInitialBurst = true;
  private initialBurstTimer?: ReturnType<typeof setTimeout>;
  private arrivalTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private copiedTimeout?: ReturnType<typeof setTimeout>;
  private currentUserId: string | null = null;

  constructor(
    private readonly oauthService: OAuthService,
    private readonly mqttConnectionService: MqttConnectionService,
    private readonly monitoredCardService: MonitoredCardService,
    private readonly recorderService: RecorderService,
    private readonly router: Router
  ) {

  }

  private connectedSubscription?: Subscription;

  ngOnInit(): void {
    this.currentUserId = this.oauthService.getIdentityClaims()?.['sub'] ?? null;

    this.connectedSubscription = this.mqttConnectionService.connected$.subscribe(
      (isConnected: boolean) => {

        console.log('MQTT Connected:', isConnected);

        if (isConnected) {
          this.iniciarRastreamentoMqtt();
        }

      }
    );

    if (this.mqttSubscription) {
      // Just waiting for the state subscription above to trigger
    }

    this.listaTransicoes()

  }

  private iniciarRastreamentoMqtt(): void {
    this.loading = true;

    this.mqttSubscription = this.mqttConnectionService.observe('owntracks/#').subscribe((message: IMqttMessage) => {
      try {
        const jsonString = new TextDecoder().decode(message.payload);
        const payload = JSON.parse(jsonString);

        if (payload._type === 'card') {
          this.upsertCard(payload as FriendCard, message.topic);
        } else if (payload._type === 'location') {
          this.upsertLocation(payload as OwnTracksLocation, message.topic);
        } else if (payload._type === 'lwt') {
          this.removeByTopic(message.topic);
        }
      } catch (error) {
        console.error('Erro ao processar payload MQTT do OwnTracks:', error);
      }
    });

    this.initialBurstTimer = setTimeout(() => {
      this.isInitialBurst = false;
      this.loading = false;
    }, 1500);
  }

  listaTransicoes() {

    if (this.selectedFriend?.card?.name)
      this.recorderService.listaTransicoes(
        {
          device: this.selectedFriend.card.name,
          lastDay: true,
          limit: 20
        }).subscribe(response => {
          this.minhaListaDeTransicoes = response;
        });
  }

  getCompanhias(friend: FriendPresence): FriendPresence[] {
    if (!friend || !friend.location) return [];

    const regioesDoAmigo = this.regionsOf(friend);
    if (regioesDoAmigo.length === 0) return [];

    return this.friends.filter(outroAmigo => {
      if (outroAmigo.id === friend.id) return false;

      const regioesDoOutro = this.regionsOf(outroAmigo);

      return regioesDoAmigo.some(regiao => regioesDoOutro.includes(regiao));
    });
  }

  get filteredFriends(): FriendPresence[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.friends;
    }
    return this.friends.filter(
      (f) => f.card.tid.toLowerCase().includes(term) || f.card.name.toLowerCase().includes(term)
    );
  }

  trackByFriend(_index: number, friend: FriendPresence): string {
    return friend.id;
  }

  /** Delay de animação em cascata para o carregamento inicial da lista. */
  entranceDelay(index: number): string {
    return `${Math.min(index, 12) * 40}ms`;
  }

  isJustArrived(friend: FriendPresence): boolean {
    return this.justArrivedIds.has(friend.id);
  }

  battery(friend: FriendPresence): BatteryInfo | null {
    return batteryInfo(friend.location?.batt, friend.location?.bs);
  }

  motion(friend: FriendPresence): MotionInfo | null {
    return topMotionActivity(friend.location?.motionactivities);
  }

  lastUpdate(friend: FriendPresence): string {
    return relativeTime(friend.location?.tst);
  }

  regionsOf(friend: FriendPresence): string[] {
    const loc = friend.location;
    if (!loc) {
      return [];
    }
    const fromDevice = loc.inregions ?? [];
    const fromBackend = matchRegisteredRegions(loc.lat, loc.lon, this.registeredRegions).map((r) => r.name);
    return Array.from(new Set([...fromDevice, ...fromBackend]));
  }

  isInsideAnyRegion(friend: FriendPresence): boolean {
    return this.regionsOf(friend).length > 0;
  }

  regionDotColor(friend: FriendPresence): string | null {
    const loc = friend.location;
    if (!loc) {
      return null;
    }
    const matched = matchRegisteredRegions(loc.lat, loc.lon, this.registeredRegions);
    if (matched.length) {
      return matched[0].color ?? '#64748B';
    }
    return (loc.inregions ?? []).length > 0 ? '#64748B' : null;
  }

  hasAddress(friend: FriendPresence): boolean {
    return !!this.addressById[friend.id];
  }

  addressOf(friend: FriendPresence): string | null {
    return this.addressById[friend.id] ?? null;
  }

  requestAddress(friend: FriendPresence): void {
    const loc = friend.location;
    if (!loc) {
      return;
    }
    this.locateAddress.emit({ id: friend.id, lat: loc.lat, lon: loc.lon });
  }

  openDetails(friend: FriendPresence): void {
    this.selectedFriend = friend;
    sessionStorage.setItem('rastreador_selected_friend_id', friend.id);
    this.monitoredCardService.monitorCard(friend);
    this.friendSelected.emit(friend);
  }

  monitorFriend(friend: FriendPresence): void {
    this.monitoredCardService.monitorCard(friend);
    this.monitoredCardService.requestCenter();
    this.closeDetails();
    this.router.navigate(['/mapa']);
  }

  closeDetails(): void {
    this.selectedFriend = null;
    sessionStorage.removeItem('rastreador_selected_friend_id');
  }

  async copyId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      this.copied = true;
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Clipboard indisponível; falha silenciosamente.
    }
  }

  /** Força uma nova assinatura, limpando o estado atual e revalidando a lista com o broker. */
  onRefresh(): void {
    this.mqttSubscription?.unsubscribe();
    this.presenceByTid.clear();
    this.tidByTopic.clear();
    this.friends = [];
    this.justArrivedIds.clear();
    this.isInitialBurst = true;

    this.iniciarRastreamentoMqtt();
    this.refresh.emit();
  }

  private upsertCard(card: FriendCard, topic: string): void {
    if (this.currentUserId && card.name === this.currentUserId) {
      return;
    }
    if (!card.tid) {
      console.warn('Card recebido sem "tid", ignorando (não há como cruzar com a localização):', card);
      return;
    }

    const isNewTid = !this.presenceByTid.has(card.tid);
    const existing = this.presenceByTid.get(card.tid);

    const presence: FriendPresence = {
      id: card.tid,
      topic,
      card,
      location: existing?.location,
      address: existing?.address ?? null,
    };
    this.presenceByTid.set(card.tid, presence);
    this.tidByTopic.set(topic, card.tid);
  //  this.rebuildFriends();

    if (isNewTid && !this.isInitialBurst) {
      this.markAsJustArrived(presence.id);
    }
  }

  private upsertLocation(location: OwnTracksLocation, topic: string): void {
    if (!location.tid) {
      console.warn('Location recebida sem "tid", ignorando (não há como cruzar com o card):', location);
      return;
    }

    const existing = this.presenceByTid.get(location.tid);
    this.tidByTopic.set(topic, location.tid);

    if (existing) {
      if (this.currentUserId && existing.card.name === this.currentUserId) {
        return;
      }
      this.presenceByTid.set(location.tid, { ...existing, location });
      this.rebuildFriends();
      return;
    }

    const placeholderCard: FriendCard = {
      _type: 'card',
      qos: 0,
      retained: false,
      _id: location.tid,
      name: location.tid,
      face: 'jelly',
      color: '#abd451',
      tid: location.tid,
    };
    const presence: FriendPresence = { id: location.tid, topic, card: placeholderCard, location };
    this.presenceByTid.set(location.tid, presence);
    this.rebuildFriends();

    if (!this.isInitialBurst) {
      this.markAsJustArrived(presence.id);
    }
  }

  /**
   * O "lwt" nem sempre traz `tid` no corpo, então usamos o tópico em que ele chegou
   * para descobrir de qual tid estávamos falando (populado a cada card/location).
   */
  private removeByTopic(topic: string): void {
    const tid = this.tidByTopic.get(topic);
    if (!tid) {
      return;
    }
    this.presenceByTid.delete(tid);
    this.tidByTopic.delete(topic);
    this.rebuildFriends();

    if (this.selectedFriend?.id === tid) {
      this.selectedFriend = null;
    }
  }

  private rebuildFriends(): void {
    this.friends = Array.from(this.presenceByTid.values());

    // Restaura o card selecionado se a página foi recarregada
    if (!this.selectedFriend) {
      const savedFriendId = sessionStorage.getItem('rastreador_selected_friend_id');
      if (savedFriendId) {
        const found = this.friends.find(f => f.id === savedFriendId);
        if (found) {
          // Não chamamos openDetails direto para evitar emitir múltiplos eventos ou loop
          this.selectedFriend = found;
          this.monitoredCardService.monitorCard(found);
          this.friendSelected.emit(found);
        }
      }
    }
  }

  private markAsJustArrived(id: string): void {
    this.justArrivedIds.add(id);
    clearTimeout(this.arrivalTimers.get(id));
    const timer = setTimeout(() => {
      this.justArrivedIds.delete(id);
      this.arrivalTimers.delete(id);
    }, 3000);
    this.arrivalTimers.set(id, timer);
  }

  ngOnDestroy(): void {
    if (this.mqttSubscription) {
      this.mqttSubscription.unsubscribe();
    }
    if (this.connectedSubscription) {
      this.connectedSubscription.unsubscribe();
    }
    clearTimeout(this.initialBurstTimer);
    this.arrivalTimers.forEach((timer) => clearTimeout(timer));
    clearTimeout(this.copiedTimeout);
  }
}
