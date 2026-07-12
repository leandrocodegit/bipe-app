import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

// Módulos PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';
import { KeycloakService } from '@/shared/services/keycloak.service';

// --- Interfaces para os dados de Sessão do Keycloak ---
interface KeycloakClient {
  clientId: string;
  clientName: string;
  userConsentRequired: boolean;
  inUse: boolean;
  offlineAccess: boolean;
}

interface KeycloakSession {
  id: string;
  ipAddress: string;
  started: number;
  lastAccess: number;
  expires: number;
  clients: KeycloakClient[];
  browser: string;
  current: boolean;
}

interface KeycloakDevice {
  os: string;
  osVersion: string;
  device: string;
  lastAccess: number;
  current: boolean;
  sessions: KeycloakSession[];
  mobile: boolean;
}

@Component({
  selector: 'app-keycloak-sessions',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ChipModule,
    ProgressSpinnerModule,
    MessageModule
  ],
  templateUrl: './keycloak-sessions.component.html',
  styleUrls: ['./keycloak-sessions.component.scss']
})
export class KeycloakSessionsComponent implements OnInit {
  // Recebe a lista de dispositivos e sessões da API
  @Input() devices: KeycloakDevice[] = [];

  // Estado de carregamento
  @Input() isLoading: boolean = false;

  // Emite o ID da sessão que o usuário deseja encerrar
  @Output() onSignOutSession = new EventEmitter<string>();

    constructor(
      private readonly keycloakService: KeycloakService,
      public readonly confirmationService: ConfirmationService
    ) { }


  ngOnInit(): void {
    this.carregarSessoes();
  }

  private carregarSessoes(){
    this.keycloakService.listaSessionsDevices().subscribe(response => {
          this.devices = response;
        });
  }

  protected getDeviceIcon(device: KeycloakDevice): string {
    if (device.mobile) {
      return 'pi pi-mobile';
    }
    if (device.os.toLowerCase().includes('windows')) {
      return 'pi pi-desktop'; // O ícone 'pi-microsoft' pode não estar disponível
    }
    if (device.os.toLowerCase().includes('mac') || device.os.toLowerCase().includes('apple')) {
      return 'pi pi-apple';
    }
    if (device.os.toLowerCase().includes('linux')) {
      return 'pi pi-linux';
    }
    return 'pi pi-globe'; // Ícone padrão
  }


  protected signOut(sessionId: string): void {
    this.confirmationService.confirm({
      message: 'Deseja desconectar a sessão deste dispositivo?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        icon: 'pi pi-sign-out',
        label: 'Desconectar Disponsitivo',
        severity: 'danger',
      },
      accept: () => {
       this.keycloakService.removerSessionsDevices(sessionId).subscribe(() => this.carregarSessoes());
      }
    });
  }
}
