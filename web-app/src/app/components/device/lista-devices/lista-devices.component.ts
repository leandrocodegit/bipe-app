import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { Device } from '@/shared/models/device.model';
import { ShareDeviceComponent } from '../share-device/share-device.component';
import { DialogModule } from 'primeng/dialog';
import { DeviceService } from '@/shared/services/device.service';
import { AudioCallService } from '@/shared/services/audio-call.service';
import { HistoricoRotinasComponent } from '@/components/rotinas/historico-rotinas/historico-rotinas.component';
import { CheckboxModule } from 'primeng/checkbox';
import { FriendDetailComponent } from '@/shared/components/friend-detail/friend-detail.component';
import { FriendPresence } from '@/shared/models/friends.model';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';


@Component({
  selector: 'app-lista-devices',
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule,
    DialogModule,
    ShareDeviceComponent,
    CheckboxModule,
    HistoricoRotinasComponent,
    SplitButtonModule,
    MenuModule,
    FriendDetailComponent
  ],
  templateUrl: './lista-devices.component.html',
  styleUrl: './lista-devices.component.scss'
})
export class ListaDevicesComponent {

  @Input({ required: true }) devices: Device[] = [];
  @Input() loading = false;
  @Input() shareMode = false;
  @Output() disconnect = new EventEmitter<Device>();
  @Output() refresh = new EventEmitter<void>();

  protected searchTerm = '';
  protected skeletonRows = [1, 2, 3];
  protected view = false;
  protected selected?: Device;
  protected apelido = '';
  protected mostrarDetalhe = false;
  protected deviceDetailToShow?: FriendPresence;
  protected mostrarPermissoes = false;
  protected selectedDeviceForPerms?: Device;
  protected selectedOpMode: number = 1;

  protected items: MenuItem[] = [
    {
      label: 'Editar apelido',
      icon: 'edit_square',
      command: (device: any) => this.editApelido(device)
    },
    {
      label: 'Permissões',
      icon: 'shield',
      command: (device: any) => this.abrirPermissoes(device)
    },
    {
      label: 'Compartilhar',
      share: true,
      icon: 'share',
    },
    {
      label: 'Histórico',
      historico: true,
      icon: 'history',
    }
  ]

  constructor(
    private audioCallService: AudioCallService,
    private readonly deviceService: DeviceService) { }

  chamar(device: Device) {
    this.audioCallService.startOutgoingCall(device.id, device.username)
  }

  verDetalhes(device: Device): void {
    this.deviceDetailToShow = {
      id: device.id,
      topic: `owntracks/${device.username}/${device.id}`,
      card: {
        _type: 'card',
        qos: 0,
        retained: false,
        _id: device.id,
        tid: device.tid,
        nickname: device.apelido || device.nome,
        name: device.nome,
        color: device.color || '#6366F1',
        face: device.icon || 'cat'
      }
    };
    this.mostrarDetalhe = true;
  }

  salvarApelido() {
    if (!this.selected) return;
    this.deviceService.salvarApelido({
      id: this.selected.id,
      apelido: this.apelido
    }).subscribe({
      next: () => {
        this.view = false;

        let device = this.devices.find(device => this.selected!.id === device.id);

        if (device)
          device.apelido = this.apelido;

        delete this.selected;
        this.apelido = '';
      }
    });
  }

  editApelido(event: any) {
    this.view = true;
  }

  abrirPermissoes(device: Device): void {
    this.selectedDeviceForPerms = device;
    this.selectedOpMode = device.opMode || 1;
    this.mostrarPermissoes = true;
  }

  salvarPermissoes(): void {
    if (!this.selectedDeviceForPerms) return;
    this.deviceService.updateOpMode(this.selectedDeviceForPerms.id, this.selectedOpMode).subscribe({
      next: () => {
        this.selectedDeviceForPerms!.opMode = this.selectedOpMode;
        this.mostrarPermissoes = false;
        delete this.selectedDeviceForPerms;
        this.refresh.emit();
      },
      error: (err) => console.error('Erro ao atualizar permissões do dispositivo:', err)
    });
  }

  get filteredDevices(): Device[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.devices;
    }
    return this.devices.filter(
      (d) =>
        d.nome.toLowerCase().includes(term) ||
        d.username.toLowerCase().includes(term) ||
        d.clientId.toLowerCase().includes(term)
    );
  }

  get connectedCount(): number {
    return this.devices.filter((d) => d.conectado).length;
  }

  trackByDevice(_index: number, device: Device): string {
    return device.id;
  }

  /** Escolhe um ícone coerente com o tipo de cliente, a partir do clientId/username. */
  getDeviceIcon(device: Device): string {
    const key = (device.os || device.username || device.clientId || '').toLowerCase();
    if (!key) {
      return 'pi pi-desktop';
    }

    if (key.includes('iphone') || key.includes('ios')) {
      return 'pi pi-apple';
    }
    if (key.includes('android')) {
      return 'pi pi-android';
    }
    if (key.includes('service') || key.includes('server') || key.includes('bot')) {
      return 'pi pi-server';
    }
    if (key.includes('tablet') || key.includes('ipad')) {
      return 'pi pi-tablet';
    }
    return 'pi pi-desktop';
  }

  onDisconnect(device: Device, event: Event): void {
    event.stopPropagation();
    this.disconnect.emit(device);
  }

  toggleMenu(event: Event, menu: Menu) {
    event.stopPropagation();
    menu.toggle(event);
  }

  onRefresh(): void {
    this.refresh.emit();
  }
}
