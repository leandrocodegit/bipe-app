import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ConfirmationService } from 'primeng/api';
import { KeycloakService } from '@/shared/services/keycloak.service';
import { AuthService } from '@/core/auth/services/auth.service';

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

  @Input() devices: KeycloakDevice[] = [];
  @Input() isLoading = false;
  @Input() checkMax = false;
  @Input() current = false;
  @Input() showClientes = false;
  @Input() showEncerrarOutros = false;
  @Output() onSignOutSession = new EventEmitter<string>();

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly authService: AuthService,
    private readonly keycloakService: KeycloakService,
    public readonly confirmationService: ConfirmationService,
    private readonly router: Router
  ) { }


  ngOnInit(): void {
    this.carregarSessoes();

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'account_auth_ok' && event.data?.token) {
        sessionStorage.setItem('account_token', event.data?.token);
        this.carregarSessoes();
      }

    };
  }

  private carregarSessoes(): void {
    this.keycloakService.listaSessionsDevices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.devices = response;

          if (this.router.url.startsWith('/painel/tarefa'))
            sessionStorage.removeItem('redirect-session-account');

          if (this.current)
            this.devices.forEach(device => {
              device.sessions = device.sessions.filter(s => s.current);
            });

          if (this.checkMax && response.length > 1)
            this.confirmationService.confirm({
              message: 'Não é possível assinar documentos conectado a mais de um dispositivo, encerre para continuar!',
              header: 'Ação necessária',
              closable: true,
              closeOnEscape: true,
              rejectVisible: false,
              icon: 'pi pi-exclamation-triangle',
              acceptButtonProps: { label: 'Ok' }
            });
        },
        error: err => console.error('Erro ao carregar sessões:', err)
      });
  }

  protected get hasOutrosSessoes(): boolean {
    return this.devices.some(device => device.sessions.some(s => !s.current));
  }

  protected signOutAllOthers(): void {
    this.confirmationService.confirm({
      message: 'Deseja encerrar todas as sessões de outros dispositivos?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { icon: 'pi pi-sign-out', label: 'Encerrar outros dispositivos', severity: 'danger' },
      accept: () => {
        const sessoes = this.devices
          .flatMap(device => device.sessions)
          .filter(s => !s.current);

        const requests = sessoes.map(s =>
          this.keycloakService.removerSessionsDevices(s.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
        );

        Promise.all(requests.map(r => r.toPromise()))
          .then(() => this.carregarSessoes())
          .catch(err => console.error('Erro ao encerrar sessões:', err));
      }
    });
  }

  protected signOut(sessionId: string): void {
    this.confirmationService.confirm({
      message: 'Deseja desconectar a sessão deste dispositivo?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      acceptButtonProps: { icon: 'pi pi-sign-out', label: 'Desconectar dispositivo', severity: 'danger' },
      accept: () => {
        this.keycloakService.removerSessionsDevices(sessionId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.carregarSessoes(),
            error: err => console.error('Erro ao encerrar sessão:', err)
          });
      }
    });
  }

  public getSession(): any {
    return this.devices[0].sessions[0];
  }

  public getSessions(): any {
    return this.devices;
  }

  protected getDeviceIcon(device: KeycloakDevice): string {
    if (device.mobile) return 'pi pi-mobile';
    const os = device.os.toLowerCase();
    if (os.includes('windows')) return 'pi pi-desktop';
    if (os.includes('mac') || os.includes('apple')) return 'pi pi-apple';
    if (os.includes('linux')) return 'pi pi-linux';
    return 'pi pi-globe';
  }
}
