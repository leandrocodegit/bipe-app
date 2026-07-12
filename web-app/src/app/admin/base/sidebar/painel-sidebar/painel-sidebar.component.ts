import { AppMenu } from '@/admin/base/menu/menu.component';
import { Component, ElementRef } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-painel-sidebar',
  standalone: true,
  imports: [
    AppMenu,
    RouterModule
    ],
  templateUrl: './painel-sidebar.component.html',
  styleUrl: './painel-sidebar.component.scss'
})
export class PainelSidebarComponent {
  constructor(public el: ElementRef) { }
}
