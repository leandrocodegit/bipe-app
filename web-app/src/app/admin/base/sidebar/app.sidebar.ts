import { Component, ElementRef } from '@angular/core';
import { AppMenu } from '../menu/menu.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    AppMenu
  ],
  template: ` <div class="layout-sidebar">
        <app-menu></app-menu>
    </div>`
})
export class AppSidebar {
  constructor(public el: ElementRef) { }
}
