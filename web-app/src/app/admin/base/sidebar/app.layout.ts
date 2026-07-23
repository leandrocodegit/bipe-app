import { Component, Renderer2, ViewChild } from '@angular/core';
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
import { LayoutService } from '@/shared/services/layout.service';
import { LoadService } from '@/shared/components/preload/load.service';
import { AudioWebrtcComponent } from '@/components/media/audio-webrtc/audio-webrtc.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { NotificacaoBipeComponent } from '@/components/media/notificacao-bipe/notificacao-bipe.component';
import { AmigosProximosBarraComponent } from '@/shared/components/amigos-proximos-barra/amigos-proximos-barra.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    TopBarComponent,
    AppSidebar,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    TabsModule,
    ButtonModule,
    ProgressBarModule,
    AudioWebrtcComponent,
    NotificacaoBipeComponent,
    AmigosProximosBarraComponent
  ],
   templateUrl: './layout.html'
  })
export class AppLayout {
  overlayMenuOpenSubscription: Subscription;

  menuOutsideClickListener: any;

  @ViewChild(PainelSidebarComponent) appSidebar!: PainelSidebarComponent;

  @ViewChild(TopBarComponent) appTopBar!: TopBarComponent;

  protected viewDetalhes = false;
  protected showAmigosProximosBarra = false;
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
      this.showAmigosProximosBarra = false;
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
