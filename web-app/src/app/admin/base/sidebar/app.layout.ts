import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { PainelSidebarComponent } from './painel-sidebar/painel-sidebar.component';
import { AppSidebar } from './app.sidebar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { MqttService } from 'ngx-mqtt';
import { LayoutService } from '@/shared/services/layout.service';
import { LoadService } from '@/shared/components/preload/load.service';
import { PreloadComponent } from '@/shared/components/preload/preload.component';
import { MonitoredCardComponent } from '@/shared/components/monitored-card/monitored-card.component';
import { AudioWebrtcComponent } from '@/components/media/audio-webrtc/audio-webrtc.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    TopBarComponent,
    AppSidebar,
    RouterModule,
    PreloadComponent,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    ButtonModule,
    MonitoredCardComponent,
    AudioWebrtcComponent
  ],
  template: `
<div class="layout-wrapper" [ngClass]="containerClass">
  <app-top-bar class="z-50 relative"></app-top-bar>
  <!-- Sidebar apenas para Desktop (hidden no Mobile, a menos que o menu mobile esteja ativo) -->
  <app-sidebar [class.hidden]="!layoutService.layoutState().staticMenuMobileActive && layoutService.isMobile()" class="lg:block z-40 relative"></app-sidebar>

  <div class="layout-main-container p-0! h-[100dvh] absolute top-0 left-0 right-0 overflow-hidden"
       [ngClass]="{ 'bg-surface-50 dark:bg-surface-950': router.url.startsWith('/conta') }">
    <!-- MAPA GLOBAL NO FUNDO -->

    <!-- UI SOBREPOSTA (ROUTER + BOTTOM BAR) -->
    <div class="absolute inset-0 z-10 pointer-events-none flex flex-col pt-16">
      <app-audio-webrtc class="pointer-events-auto z-50 w-full shrink-0"></app-audio-webrtc>

      <div class="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col lg:flex-row pointer-events-none">

        @if(load){
        <app-preload class="pointer-events-auto z-50"></app-preload>
        }

        <!-- Outlet transparente -->
        <div class="flex-1 w-full min-h-0 relative pointer-events-none"
             [class.pointer-events-auto]="router.url.startsWith('/conta') || router.url.startsWith('/mapa')">
          <!-- As telas (como friends) usarão pointer-events-auto no seu conteúdo principal -->
          <router-outlet></router-outlet>
        </div>

        <!-- Monitored Card: Flutuante no Desktop, Bottom Sheet no Mobile -->
        <app-monitored-card *ngIf="router.url != '/mapa/waypoint' && !router.url.startsWith('/conta')" class="pointer-events-auto shrink-0 z-40 contents lg:block lg:absolute lg:right-4 lg:top-4 lg:w-96"></app-monitored-card>

        <p-toast [breakpoints]="{ '920px': { width: '96%', right: '0', left: '5px' } }" class="pointer-events-auto z-50"/>
        <p-confirmdialog class="pointer-events-auto z-50"/>
      </div>

      <!-- BOTTOM NAVIGATION BAR (Apenas Mobile) -->
      <div class="lg:hidden pointer-events-auto w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-slate-200 dark:border-neutral-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe shrink-0 z-50">
        <div class="flex justify-around items-center h-16">
          <a routerLink="/mapa" routerLinkActive="text-emerald-500" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
            <i class="pi pi-map text-xl mb-1"></i>
            <span class="text-[10px] font-medium">Mapa</span>
          </a>
          <a routerLink="/friends" routerLinkActive="text-emerald-500" class="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
            <i class="pi pi-users text-xl mb-1"></i>
            <span class="text-[10px] font-medium">Amigos</span>
          </a>
          <a routerLink="/devices" routerLinkActive="text-emerald-500" class="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
            <i class="pi pi-tablet text-xl mb-1"></i>
            <span class="text-[10px] font-medium">Dispositivos</span>
          </a>
          <a routerLink="/rotinas" routerLinkActive="text-emerald-500" class="flex flex-col items-center justify-center w-full h-full text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
            <i class="pi pi-directions text-xl mb-1"></i>
            <span class="text-[10px] font-medium">Rotinas</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class AppLayout {
  overlayMenuOpenSubscription: Subscription;

  menuOutsideClickListener: any;

  @ViewChild(PainelSidebarComponent) appSidebar!: PainelSidebarComponent;

  @ViewChild(TopBarComponent) appTopBar!: TopBarComponent;

  protected viewDetalhes = false;
  protected load = false;
  protected instanceId?: any;

  constructor(
    public layoutService: LayoutService,
    public renderer: Renderer2,
    public router: Router,
    private readonly nagivate: ActivatedRoute,
    private readonly loadService: LoadService
  ) {

    loadService.loadUpdate$.subscribe(data => {
        var intervalo = setInterval(() => {
          this.load = data;
          clearInterval(intervalo);
        }, 100);

    })

    this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
      if (!this.menuOutsideClickListener) {
        this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
          if (this.isOutsideClicked(event)) {
            this.hideMenu();
          }
        });
      }

      if (this.layoutService.layoutState().staticMenuMobileActive) {
        this.blockBodyScroll();
      }
    });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.hideMenu();
    });
  }

  isOutsideClicked(event: MouseEvent) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');
    const eventTarget = event.target as Node;

    return !(sidebarEl?.isSameNode(eventTarget) || sidebarEl?.contains(eventTarget) || topbarEl?.isSameNode(eventTarget) || topbarEl?.contains(eventTarget));
  }

  hideMenu() {
    this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
    if (this.menuOutsideClickListener) {
      this.menuOutsideClickListener();
      this.menuOutsideClickListener = null;
    }
    this.unblockBodyScroll();
  }

  blockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll');
    } else {
      document.body.className += ' blocked-scroll';
    }
  }

  unblockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll');
    } else {
      document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }

  get containerClass() {
    return {
      'layout-overlay': this.layoutService.layoutConfig().menuMode === 'overlay',
      'layout-static': this.layoutService.layoutConfig().menuMode === 'static',
      'layout-static-inactive': this.layoutService.layoutState().staticMenuDesktopInactive && this.layoutService.layoutConfig().menuMode === 'static',
      'layout-overlay-active': this.layoutService.layoutState().overlayMenuActive,
      'layout-mobile-active': this.layoutService.layoutState().staticMenuMobileActive
    };
  }

  ngOnDestroy() {
    if (this.overlayMenuOpenSubscription) {
      this.overlayMenuOpenSubscription.unsubscribe();
    }

    if (this.menuOutsideClickListener) {
      this.menuOutsideClickListener();
    }
  }
}
