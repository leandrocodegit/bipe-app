import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from '../../../app.configurator';
import { OAuthService } from 'angular-oauth2-oidc';
import { SelectModule } from 'primeng/select';
import { AuthService } from '@/core/auth/services/auth.service';
import { PopoverModule } from 'primeng/popover';
import { BrokerStatusComponent } from '@/shared/components/broker-status/broker-status.component';
import { LayoutService } from '@/shared/services/layout.service';
import { ButtonModule } from 'primeng/button';
import { RotinaService } from '@/shared/services/rotina.service';
import { BipeConfigService } from '@/shared/services/bipe-config.service';
import { RotinaNaoAtendidaDetailComponent } from '@/components/rotinas/rotina-nao-atendida-detail/rotina-nao-atendida-detail.component';
import { BipeExecucaoDetailComponent } from '@/components/rotinas/bipe-execucao-detail/bipe-execucao-detail.component';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    AppConfigurator,
    SelectModule,
    PopoverModule,
    BrokerStatusComponent,
    ButtonModule,
    ProgressBarModule,
    RotinaNaoAtendidaDetailComponent,
    BipeExecucaoDetailComponent
  ],
  templateUrl: './top-bar.component.html'
})
export class TopBarComponent implements OnInit {

  @Input() noToogle = false;
  protected items!: MenuItem[];
  protected isLogin = false;
  protected unattendedCount = 0;
  protected naoAtendidas: any[] = [];
  protected mostrarAlertaDetalhe = false;
  protected alertaSelecionado: any = null;

  protected bipeCount = 0;
  protected bipeExecucoes: any[] = [];
  protected mostrarBipeDetalhe = false;
  protected bipeSelecionado: any = null;

  constructor(
    public readonly layoutService: LayoutService,
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService,
    private readonly rotinaService: RotinaService,
    private readonly bipeConfigService: BipeConfigService
  ) {
    this.oauthService.events
      .pipe()
      .subscribe((e: any) => {
        if (e.type == 'token_received' || e.type == 'token_refreshed') {
          this.isLogin = oauthService.hasValidAccessToken() || authService.valid();
          if (this.isLogin) {
            this.buscarNaoAtendidas();
            this.buscarBipeExecucoes();
          }
        }
      });
  }

  ngOnInit(): void {
    this.isLogin = this.oauthService.hasValidAccessToken() || this.authService.valid();
    if (this.isLogin) {
      this.buscarNaoAtendidas();
      this.buscarBipeExecucoes();
      const interval = setInterval(() => {
        if (this.unattendedCount == 0 && this.bipeCount == 0) {
          this.buscarNaoAtendidas();
          this.buscarBipeExecucoes();
        } else {
          clearInterval(interval);
        }
      }, 30000);
    }
  }

  buscarNaoAtendidas() {
    this.rotinaService.statusRotina().subscribe({
      next: (res) => {
        this.naoAtendidas = res?.naoAtendidas || [];
        this.unattendedCount = this.naoAtendidas.length;
      },
      error: (err) => console.error('Erro ao buscar rotinas não atendidas:', err)
    });
  }

  buscarBipeExecucoes() {
    this.bipeConfigService.getUltimas24hExecucoes().subscribe({
      next: (res) => {
        this.bipeExecucoes = res || [];
        this.bipeCount = this.bipeExecucoes.length;
      },
      error: (err) => console.error('Erro ao buscar execuções de bipe:', err)
    });
  }

  marcarComoLida(id: string, event: Event) {
    event.stopPropagation();
    this.rotinaService.marcarNaoAtendidaComoLida(id).subscribe({
      next: () => this.buscarNaoAtendidas(),
      error: (err) => console.error('Erro ao marcar não atendida como lida:', err)
    });
  }

  abrirAlerta(alerta: any) {
    this.alertaSelecionado = alerta;
    this.mostrarAlertaDetalhe = true;
  }

  abrirBipeExecucao(bipeExec: any) {
    this.bipeSelecionado = bipeExec;
    this.mostrarBipeDetalhe = true;
  }

  toggleDarkMode() {
    this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    this.layoutService.setPreferencias();
  }

  sideBarOpen() {
    localStorage.setItem('toggle', String(this.layoutService.toogled()));
    this.layoutService.onMenuToggle();
    if (this.layoutService.isDesktop())
      this.layoutService.setPreferencias();

  }

  getFriendlyButtonLabel(button: string): string {
    if (!button) return '';
    switch (button.toUpperCase()) {
      case 'VOL_UP': return 'Botão Aumentar';
      case 'VOL_DOWN': return 'Botão Diminuir';
      case 'VOL_TICK': return 'Toque Único';
      case 'HEADSET': return 'Botão do Fone';
      case 'REMOTE': return 'Vibração Remota';
      case 'PLAY': return 'Play';
      case 'PAUSE': return 'Pause';
      case 'STOP': return 'Stop';
      default: return button;
    }
  }

  login(): void {
    this.authService.loginOrdic();
  }

  logout() {
    this.authService.logoutOrdic();
  }
}
