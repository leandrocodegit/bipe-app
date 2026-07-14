import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Importações do PrimeNG necessárias
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { Device } from '@/shared/models/device.model';
import { RotinaService } from '@/shared/services/rotina.service';
import { DeviceService } from '@/shared/services/device.service';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Routine } from '@/shared/models/rotina.model';

@Component({
  selector: 'app-zona-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    MultiSelectModule,
    CheckboxModule,
    TagModule,
    TableModule
  ],
  templateUrl: './zona-form-dialog.component.html',
})
export class ZonaFormDialogComponent implements OnInit {
  @Input() visible = false;
  @Input() latLng: any;
  protected devices: any[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() salvar = new EventEmitter<any>();

  protected deviceSearchTerm = '';

  // Dicionário para o Dropdown
  protected tiposEvento = [
    { label: 'Entrada / Saída (Ambos)', value: 'ENTER_EXIT' },
    { label: 'Apenas Entrada', value: 'ENTER' },
    { label: 'Apenas Saída', value: 'EXIT' }
  ];

  // Definição visual e de valor para os dias
  protected diasDefinicao = [
    { label: 'D', valor: 'Dom' },
    { label: 'S', valor: 'Seg' },
    { label: 'T', valor: 'Ter' },
    { label: 'Q', valor: 'Qua' },
    { label: 'Q', valor: 'Qui' },
    { label: 'S', valor: 'Sex' },
    { label: 'S', valor: 'Sab' }
  ];

  protected viewWaipoints = false;


  @Input() formulario: Routine = {
    nome: '',
    horaInicio: '08:00',
    horaTermino: '18:00',
    diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    devices: [] ,
    tipo: 'ENTER',
    ativo: true
  };

  constructor(
    private readonly deviceService: DeviceService,
    private readonly rotinaService: RotinaService) { }


  ngOnInit(): void {
    this.listaDevices()
  }

  listaDevices() {
    this.deviceService.listDevices().subscribe(response => this.devices = response)
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

    this.salvar.emit();
    this.fechar();
    this.rotinaService.criarWayPoint({
      ...this.formulario,
      devices: this.formulario.devices.map(device => device.id) , 
  }).subscribe(() => this.resetFormulario());
  }

  private resetFormulario(): void {
    this.formulario = {
      nome: '',
      horaInicio: '08:00',
      horaTermino: '18:00',
      diasSemana: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      devices: [],
      tipo: 'ENTER',
      ativo: true
    };
  }

  getDeviceIcon(device: Device): string {
    const key = device.os;
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
    const idx = this.formulario.devices.indexOf(device.id);
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
      // desmarca só os que estão visíveis no filtro atual
      this.formulario.devices = this.formulario.devices.filter(
        (id: Device) => !this.filteredDevicesTable.some((d) => d.id === id.id)
      );
    } else {
      const idsToAdd = this.filteredDevicesTable
        .map((d) => d.id)
        .filter((id) => !this.formulario.devices.some(device => device.id == id.id));
      this.formulario.devices = [...this.formulario.devices, ...idsToAdd];
    }
  }
}
