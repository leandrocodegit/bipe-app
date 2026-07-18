import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
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
import { WaypointService } from '@/shared/services/waypoint.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-waypoint-form-dialog',
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
    TableModule,
    TagModule
  ],
  templateUrl: './waypoint-form-dialog.component.html',
})
export class WaypointFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() latLng: any; // Coordenada recebida do mapa
  @Input() devices: any[] = []; // Sua lista: protected devices: Device[] = [];
  @Input() waypointToEdit: any = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() salvar = new EventEmitter<any>();

  protected deviceSearchTerm = '';
  protected formulario = {
    desc: '',
    rad: 50,
    deviceIds: [] as string[]
  };

  constructor(private readonly waypointService: WaypointService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.waypointToEdit) {
        this.formulario = {
          desc: this.waypointToEdit.desc,
          rad: this.waypointToEdit.rad,
          deviceIds: [...(this.waypointToEdit.deviceIds || [])]
        };
        this.latLng = {
          lat: this.waypointToEdit.lat,
          lng: this.waypointToEdit.lon
        };
      } else {
        this.resetFormulario();
      }
    }
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  confirmar(): void {
    // Monta o payload final exato
    const payloadFinal: any = {
      desc: this.formulario.desc,
      deviceIds: this.formulario.deviceIds,
      lat: this.latLng ? this.latLng.lat : 0,
      lon: this.latLng ? this.latLng.lng : 0,
      rad: this.formulario.rad
    };

    if (this.waypointToEdit && this.waypointToEdit.id) {
      payloadFinal.id = this.waypointToEdit.id;
    }

    this.salvar.emit(payloadFinal);
    this.fechar();
    this.resetFormulario();

    this.waypointService.criarWayPoint(payloadFinal).subscribe();
  }

  private resetFormulario(): void {
    this.formulario = {
      desc: '',
      rad: 50,
      deviceIds: [],
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
    return this.formulario.deviceIds.includes(device.id);
  }

  toggleDevice(device: any): void {
    const idx = this.formulario.deviceIds.indexOf(device.id);
    if (idx >= 0) {
      this.formulario.deviceIds.splice(idx, 1);
    } else {
      this.formulario.deviceIds.push(device.id);
    }
  }

  get allFilteredSelected(): boolean {
    return (
      this.filteredDevicesTable.length > 0 &&
      this.filteredDevicesTable.every((d) => this.formulario.deviceIds.includes(d.id))
    );
  }

  toggleSelectAll(): void {
    if (this.allFilteredSelected) {
      // desmarca só os que estão visíveis no filtro atual
      this.formulario.deviceIds = this.formulario.deviceIds.filter(
        (id: string) => !this.filteredDevicesTable.some((d) => d.id === id)
      );
    } else {
      const idsToAdd = this.filteredDevicesTable
        .map((d) => d.id)
        .filter((id) => !this.formulario.deviceIds.includes(id));
      this.formulario.deviceIds = [...this.formulario.deviceIds, ...idsToAdd];
    }
  }
}
