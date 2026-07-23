import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';

import { Device } from '@/shared/models/device.model';
import { BipeConfigService } from '@/shared/services/bipe-config.service';
import { DeviceService } from '@/shared/services/device.service';
import { BipeConfig } from '@/shared/models/bipe.model';

@Component({
  selector: 'app-bipe-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TableModule
  ],
  templateUrl: './bipe-form-dialog.component.html',
})
export class BipeFormDialogComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() salvar = new EventEmitter<any>();

  protected devices: any[] = [];
  protected deviceSearchTerm = '';

  protected diasDefinicao = [
    { label: 'D', valor: 'Dom' },
    { label: 'S', valor: 'Seg' },
    { label: 'T', valor: 'Ter' },
    { label: 'Q', valor: 'Qua' },
    { label: 'Q', valor: 'Qui' },
    { label: 'S', valor: 'Sex' },
    { label: 'S', valor: 'Sab' }
  ];

  @Input() formulario: BipeConfig = {
    nome: '',
    intervaloMinutos: 15,
    diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    devices: [],
    ativo: true
  };

  constructor(
    private readonly deviceService: DeviceService,
    private readonly bipeConfigService: BipeConfigService
  ) { }

  ngOnInit(): void {
    this.listaDevices();
  }

  listaDevices() {
    this.deviceService.listDevices().subscribe(response => this.devices = response);
  }

  toggleDia(valor: string): void {
    const index = this.formulario.diasSemana.indexOf(valor);
    if (index > -1) {
      this.formulario.diasSemana.splice(index, 1);
    } else {
      this.formulario.diasSemana.push(valor);
    }
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  confirmar(): void {
    this.fechar();
    this.bipeConfigService.salvarBipe({
      ...this.formulario,
      devices: this.formulario.devices.map((device: any) => device.id),
    }).subscribe(() => {
      this.salvar.emit();
      this.resetFormulario();
    });
  }

  private resetFormulario(): void {
    this.formulario = {
      nome: '',
      intervaloMinutos: 15,
      diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      devices: [],
      ativo: true
    };
  }

  getDeviceIcon(device: Device): string {
    const key = device?.os ?? 'pi pi-microship';
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

  get filteredDevicesTable() {
    const term = this.deviceSearchTerm.trim().toLowerCase();
    if (!term) {
      return this.devices;
    }
    return this.devices.filter(
      (d) => d.nome?.toLowerCase().includes(term) || d.os?.toLowerCase().includes(term)
    );
  }

  isDeviceSelected(device: any): boolean {
    return this.formulario.devices.some(d => device.id == d.id);
  }

  toggleDevice(device: any): void {
    const idx = this.formulario.devices.findIndex(d => d.id === device.id);
    if (idx >= 0) {
      this.formulario.devices.splice(idx, 1);
    } else {
      this.formulario.devices.push(device);
    }
  }

  get allFilteredSelected(): boolean {
    return (
      this.filteredDevicesTable.length > 0 &&
      this.filteredDevicesTable.every((d) => this.formulario.devices.some(device => device.id == d.id))
    );
  }

  toggleSelectAll(): void {
    if (this.allFilteredSelected) {
      this.formulario.devices = this.formulario.devices.filter(
        (selectedDev: any) => !this.filteredDevicesTable.some((d) => d.id === selectedDev.id)
      );
    } else {
      const devsToAdd = this.filteredDevicesTable.filter(
        (d) => !this.formulario.devices.some(device => device.id == d.id)
      );
      this.formulario.devices = [...this.formulario.devices, ...devsToAdd];
    }
  }
}
