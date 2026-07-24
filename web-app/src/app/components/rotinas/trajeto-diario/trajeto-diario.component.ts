import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';

import { DeviceService } from '@/shared/services/device.service';
import { AudioCallService } from '@/shared/services/audio-call.service';

@Component({
  selector: 'app-trajeto-diario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './trajeto-diario.component.html'
})
export class TrajetoDiarioComponent implements OnInit {

  protected loading = false;
  protected devices: any[] = [];
  protected selectedDevice: any = null;
  protected trafficMode: 'fluido' | 'moderado' | 'congestionado' = 'fluido';
  protected horaLimitePartida = '07:47';
  protected departureAlertMessage = 'Trânsito fluido! Saia no máximo às 07:47 para chegar com tranquilidade.';
  
  // Lista de rotinas mais próximas (mocadas com trânsito dinâmico)
  protected routines: any[] = [];

  constructor(
    private readonly deviceService: DeviceService,
    private readonly audioCallService: AudioCallService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.carregarDispositivos();
  }

  private carregarDispositivos(): void {
    this.loading = true;
    this.deviceService.listDevices().subscribe({
      next: (data) => {
        this.devices = data || [];
        if (this.devices.length > 0) {
          this.selectedDevice = this.devices[0];
          this.gerarRotinasMocadas();
        }
      },
      error: (err) => console.error('Erro ao carregar dispositivos para trajeto:', err),
      complete: () => { this.loading = false; }
    });
  }

  protected onDeviceChange(): void {
    this.gerarRotinasMocadas();
  }

  // Gera dados altamente charmosos de trajeto
  protected gerarRotinasMocadas(): void {
    if (!this.selectedDevice) return;

    // Fatores de multiplicação baseados no trânsito atual
    let fatorTempo = 1.0;
    if (this.trafficMode === 'moderado') {
      fatorTempo = 1.4;
      this.horaLimitePartida = '07:44';
      this.departureAlertMessage = 'Atenção: Trânsito médio. Recomendamos sair até as 07:44 para evitar atrasos nas próximas paradas.';
    } else if (this.trafficMode === 'congestionado') {
      fatorTempo = 2.1;
      this.horaLimitePartida = '07:38';
      this.departureAlertMessage = 'Alerta de Atraso! Trânsito muito pesado. Saia no máximo às 07:38 para não perder o horário de chegada!';
    } else {
      this.horaLimitePartida = '07:47';
      this.departureAlertMessage = 'Trânsito tranquilo! Você pode sair até as 07:47 para chegar com tranquilidade no Colégio Dante Alighieri.';
    }

    this.routines = [
      {
        id: '1',
        nome: 'Escola do Pedro',
        waypoint: 'Colégio Dante Alighieri',
        tipo: 'Chegada / Entrega',
        distancia: 2.8, // km
        tempoBase: 8, // minutos
        tempoEstimado: Math.round(8 * fatorTempo),
        transito: this.getTransitoPorModo(this.trafficMode, 0),
        horarioPrevisto: this.calcularHorarioChegada(0, Math.round(8 * fatorTempo)),
        endereco: 'Alameda Jaú, 1061 - Cerqueira César, São Paulo - SP',
        icone: 'school',
        cor: '#3B82F6' // azul
      },
      {
        id: '2',
        nome: 'Trabalho Leandro',
        waypoint: 'Edifício FIESP',
        tipo: 'Entrada / Trabalho',
        distancia: 4.5,
        tempoBase: 12,
        tempoEstimado: Math.round(12 * fatorTempo),
        transito: this.getTransitoPorModo(this.trafficMode, 1),
        horarioPrevisto: this.calcularHorarioChegada(Math.round(8 * fatorTempo), Math.round(12 * fatorTempo)),
        endereco: 'Av. Paulista, 1313 - Bela Vista, São Paulo - SP',
        icone: 'work',
        cor: '#10B981' // verde
      },
      {
        id: '3',
        nome: 'Supermercado Pão de Açúcar',
        waypoint: 'Pão de Açúcar - Brigadeiro',
        tipo: 'Parada / Compras',
        distancia: 7.2,
        tempoBase: 18,
        tempoEstimado: Math.round(18 * fatorTempo),
        transito: this.getTransitoPorModo(this.trafficMode, 2),
        horarioPrevisto: this.calcularHorarioChegada(Math.round(20 * fatorTempo), Math.round(18 * fatorTempo)),
        endereco: 'Av. Brigadeiro Luís Antônio, 3126 - Jardim Paulista, São Paulo - SP',
        icone: 'shopping_cart',
        cor: '#F59E0B' // âmbar
      },
      {
        id: '4',
        nome: 'Academia SmartFit',
        waypoint: 'Smart Fit - Pamplona',
        tipo: 'Parada / Treino',
        distancia: 9.0,
        tempoBase: 25,
        tempoEstimado: Math.round(25 * fatorTempo),
        transito: this.getTransitoPorModo(this.trafficMode, 3),
        horarioPrevisto: this.calcularHorarioChegada(Math.round(38 * fatorTempo), Math.round(25 * fatorTempo)),
        endereco: 'Rua Pamplona, 1704 - Jardim Paulista, São Paulo - SP',
        icone: 'fitness_center',
        cor: '#EC4899' // rosa
      },
      {
        id: '5',
        nome: 'Casa (Retorno)',
        waypoint: 'Waypoint Residência',
        tipo: 'Chegada / Final',
        distancia: 12.4,
        tempoBase: 35,
        tempoEstimado: Math.round(35 * fatorTempo),
        transito: this.getTransitoPorModo(this.trafficMode, 4),
        horarioPrevisto: this.calcularHorarioChegada(Math.round(63 * fatorTempo), Math.round(35 * fatorTempo)),
        endereco: 'Rua Bela Cintra, 2300 - Consolação, São Paulo - SP',
        icone: 'home',
        cor: '#8B5CF6' // roxo
      }
    ];
  }

  private getTransitoPorModo(modo: string, index: number): any {
    if (modo === 'fluido') {
      return { label: 'Fluido', status: 'light', cor: 'text-emerald-500 bg-emerald-500/10' };
    } else if (modo === 'moderado') {
      if (index % 2 === 0) {
        return { label: 'Moderado', status: 'moderate', cor: 'text-amber-500 bg-amber-500/10' };
      }
      return { label: 'Fluido', status: 'light', cor: 'text-emerald-500 bg-emerald-500/10' };
    } else {
      if (index === 1 || index === 2) {
        return { label: 'Lentidão Acentuada', status: 'heavy', cor: 'text-rose-500 bg-rose-500/10' };
      }
      return { label: 'Moderado', status: 'moderate', cor: 'text-amber-500 bg-amber-500/10' };
    }
  }

  private calcularHorarioChegada(tempoAcumuladoAnterior: number, tempoEstaEtapa: number): string {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() + tempoAcumuladoAnterior + tempoEstaEtapa);
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  protected alterarTransito(modo: 'fluido' | 'moderado' | 'congestionado'): void {
    this.trafficMode = modo;
    this.gerarRotinasMocadas();
  }

  protected totalDistancia(): number {
    return this.routines.reduce((acc, r) => acc + r.distancia, 0);
  }

  protected totalTempo(): number {
    // A última rotina (Casa) tem o tempo total acumulado em relação ao ponto de partida
    return this.routines.reduce((acc, r) => acc + r.tempoEstimado, 0);
  }

  protected biparRastreador(): void {
    if (this.selectedDevice) {
      this.audioCallService.sendBipe(
        this.selectedDevice.id,
        this.selectedDevice.username,
        {
          _type: 'card',
          qos: 0,
          retained: false,
          _id: this.selectedDevice.id,
          tid: this.selectedDevice.clientId,
          nickname: this.selectedDevice.apelido || this.selectedDevice.nome || this.selectedDevice.clientId,
          name: this.selectedDevice.nome || this.selectedDevice.apelido || this.selectedDevice.clientId,
          color: this.selectedDevice.color || '#6366F1',
          face: this.selectedDevice.icon || 'cat'
        },
        false
      );
    }
  }

  protected wazeTrajeto(routine: any): void {
    const lat = -23.56168; // São Paulo mocklat
    const lon = -46.65613; // São Paulo mocklon
    window.open(`https://waze.com/ul?ll=${lat},${lon}&navigate=yes`, '_blank');
  }
}
