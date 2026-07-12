import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { Popover, PopoverModule } from 'primeng/popover';
import { Subject } from 'rxjs';

import { AuthService } from '@/core/auth/services/auth.service';
import { LayoutService } from '../../../shared/services/layout.service';
import { LoadService } from '@/shared/components/preload/load.service';
import { AppMenuitem } from '../sidebar/app.menuitem';

/** Comprimento mínimo para disparar a busca de protocolo. */
const PROTOCOLO_MIN_LENGTH = 7;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    AppMenuitem,
    RouterModule,
    SelectModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    PopoverModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class AppMenu implements OnInit {

  // ─── ViewChild ────────────────────────────────────────────────────────────

  @ViewChild('op') op!: Popover;

  // ─── Injeções ─────────────────────────────────────────────────────────────

  public readonly loadService = inject(LoadService);
  public readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Estado ───────────────────────────────────────────────────────────────

  protected tenants: any[] = [];
  protected tenant: any;
  protected model: any[] = [];
  protected filteredProtocolos: any[] = [];
  protected protocolo: string = '';
  protected event?: MouseEvent;

  /**
   * Subject de busca: o pipe reativo substitui a subscription manual
   * do construtor, com switchMap cancelando requisições anteriores
   * automaticamente (evita race conditions).
   */
  protected readonly nomeFind$ = new Subject<string>();

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {

    if (this.router.url.startsWith('/portal')) {
      this.menuPortal();
    } else {
      this.menuInterno();
    }
  }

  // ─── Métodos privados ─────────────────────────────────────────────────────

  /**
   * Centraliza a lógica reativa de busca de protocolo.
   * - debounceTime: aguarda o usuário parar de digitar.
   * - distinctUntilChanged: ignora emissões com o mesmo valor.
   * - filter: só dispara se o protocolo ainda não foi encontrado e
   *   se o tamanho mínimo foi atingido.
   * - switchMap: cancela a requisição anterior se um novo valor chegar.
   * - takeUntilDestroyed: cancela a subscription quando o componente
   *   for destruído, sem necessidade de OnDestroy manual.
   */

  // ─── Handlers públicos ────────────────────────────────────────────────────

  saveEvent(event: any): void {
    this.event = event;
  }

  selectTenant(event: { value: string }): void {
    this.tenant = event.value;
    sessionStorage.setItem('X-Tenant-ID', this.tenant);
  }

  gerarProtocolo(): void {

  }

  // ─── Montagem de menus ────────────────────────────────────────────────────

  menuInterno(): void {

    this.model = [
      {
        order: 1,
        label: '',
        items: [{ label: 'Status', icon: 'pi pi-bolt', separator: false, routerLink: ['/friends'] }]
      },
      {
        order: 2,
        label: '',
        items: [{ label: 'Dispositivos', icon: 'pi pi-microchip', separator: false, routerLink: ['/devices'] }]
      },
      {
        order: 3,
        label: '',
        items: [{ label: 'Rotinas', icon: 'pi pi-directions', separator: false, routerLink: ['/rotinas'] }]
      },
      {
        order: 3,
        label: '',
        items: [{ label: 'Regiões', icon: 'pi pi-map-marker', separator: false, routerLink: ['/waypoint'] }]
      },
      {
        order: 0,
        label: '',
        items: [{ label: 'Mapa', icon: 'pi pi-map', separator: false, routerLink: ['/mapa'] },]
      },
      ...(this.layoutService.isMobile() ? [{
        order: 5,
        label: '',
        items: [{
          label: 'Configurações', icon: 'pi pi-cog', separator: false,
          command: () => {
            if ((window as any).Android) {
              (window as any).Android.openSettings();
            }
          }
        }]
      }] : []),
      ...(this.layoutService.isMobile() ? [{
        order: 5,
        label: '',
        items: [{
          label: 'Permissões', icon: 'pi pi-shield', separator: false,
          command: () => {
            if ((window as any).Android) {
              (window as any).Android.openPermissions();
            }
          }
        }]
      }] : []),
      ...(this.layoutService.isMobile() ? [{
        order: 5,
        label: '',
        items: [{
          label: 'Storage', icon: 'pi pi-database', separator: false,
          command: () => {
            if ((window as any).Android) {
              (window as any).Android.openWaypoints();
            }
          }
        }]
      }] : [])
    ];


    this.model = this.model.sort((a, b) => a.order - b.order);
  }

  menuPortal(): void {
    if (this.authService.isLoggedIn()) {
      this.model.push({
        order: 0,
        label: '',
        expanded: true,
        items: [{
          label: 'Meus Protocolos',
          icon: 'pi pi-fw pi-ticket',
          separator: false,
          routerLink: ['/portal/protocolos']
        }]
      });
    }

    const servicoItem: any = {
      order: 3,
      label: '',
      active: true,
      separator: false,
      items: [{ label: 'Serviços', icon: 'pi pi-fw pi-briefcase', items: [] }]
    };

    this.model.push(servicoItem);
  }

  /**
   * Redireciona para a rota correta ao acessar a raiz do portal.
   * Extraído de menuPortal() para melhor legibilidade.
   */
  private handlePortalRedirect(response: any[]): void {
    if (this.router.url !== '/') return;

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/portal/protocolos']);
    } else if (response.length > 0) {
      this.router.navigate([`/portal/servicos/${response[0].id}`]);
    }
  }
}
