import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-broker-status',
  template: `
   <button *ngIf="icon" class="layout-topbar-action">
           <img src="assets/drawable/{{icon}}.png" class="max-w-[80%]">
        </button>
  `,
  imports: [
    CommonModule,
    TooltipModule,
    CardModule
  ]
})
export class BrokerStatusComponent implements OnInit, OnDestroy {

  protected icon?: string;

  ngOnInit(): void {
    try {
      this.icon = (window as any).Android.getFace();
    } catch (e) {
      console.warn('Erro ao obter dados do Android Bridge:', e);
    }
  }

  ngOnDestroy(): void {
  }
}
