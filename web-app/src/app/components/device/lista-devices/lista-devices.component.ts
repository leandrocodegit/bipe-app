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
    ShareDeviceComponent
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

  constructor(private readonly deviceService: DeviceService) { }


  salvarApelido() {
    this.deviceService.salvarApelido({
      id: this.selected!.id,
      apelido: this.apelido
    }).subscribe({
      next: () => {
        this.view = false;
        delete this.selected;
        this.apelido = '';
      }
    });
  }

  editApelido(device: Device) {
    this.view = true;
    this.selected = device;
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

  onRefresh(): void {
    this.refresh.emit();
  }
}