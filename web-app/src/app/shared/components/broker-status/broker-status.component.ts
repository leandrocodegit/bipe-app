import { MqttAppModule } from '@/mqtt-app.module';
import { FriendCard } from '@/shared/models/friends.model';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IMqttMessage, MqttConnectionState, MqttService } from 'ngx-mqtt';
import { TooltipModule } from 'primeng/tooltip';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-broker-status',
  template: `
   <button *ngIf="card?.face" class="layout-topbar-action">
           <img src="assets/drawable/{{card?.face}}.png" class="max-w-[80%]">
        </button>
  `,
  imports: [
    CommonModule,
    MqttAppModule,
    TooltipModule
  ],
  providers: [
    MqttService,
  ]
})
export class BrokerStatusComponent implements OnInit, OnDestroy {
  conectado = false;
  private stateSubscription?: Subscription;

  protected card?: FriendCard;

  constructor(private readonly mqttService: MqttService) { }

  ngOnInit(): void {


    this.mqttService.state.subscribe(
      (state: MqttConnectionState) => {

        if (state === MqttConnectionState.CONNECTED) {
          this.stateSubscription = this.mqttService.observe('owntracks/user_5490c9b2/4713edf5-52f1-4cc7-a539-33c8cea4a82a/#').subscribe((message: IMqttMessage) => {
            try {

              const jsonString = new TextDecoder().decode(message.payload);
              const payload = JSON.parse(jsonString);

              if (payload._type === 'card')
                this.card = payload;

            } catch (error) {
              console.error('Erro ao processar payload MQTT do OwnTracks:', error);
            }
          });
        }

      }
    );

  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }



}
