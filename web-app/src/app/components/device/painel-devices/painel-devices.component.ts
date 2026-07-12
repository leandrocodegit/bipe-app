import { Component, OnInit } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { ListaDevicesComponent } from '../lista-devices/lista-devices.component';
import { Device } from '@/shared/models/device.model';
import { DeviceService } from '@/shared/services/device.service';
import { SharedService } from '@/shared/services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-painel-devices',
  imports: [
    TabsModule,
    ListaDevicesComponent
  ],
  templateUrl: './painel-devices.component.html',
  styleUrl: './painel-devices.component.scss'
})
export class PainelDevicesComponent implements OnInit {

  protected devices: Device[] = [];
  protected tab = 'device';

  searchTerm = '';
  skeletonRows = [1, 2, 3];

  constructor(
    private readonly deviceService: DeviceService,
    private readonly sharedService: SharedService,
    private readonly activedRoute: ActivatedRoute,
    private readonly location: Location
  ) { }

  ngOnInit(): void {
    this.activedRoute.queryParams.subscribe(param => {
      this.tab = param['tab'] ?? 'device';
      this.listar();
    });
  }

  selectTab(event: any) {
    this.tab = event;
    this.location.go(`/devices?tab=${event}`);
    this.listar();
  }

  listar() {

    if (this.tab == 'device')
      this.deviceService.listDevices().subscribe(response => this.devices = response);
    if (this.tab == 'shared')
      this.sharedService.listDevices().subscribe(response => this.devices = response.map(share => {
        return {
          ...share.device,
          share: share.sharedUsername
        }

      }));


  }
}
