import { AuthService } from '@/core/auth/services/auth.service';
import { HistoryService } from '@/shared/services/history.service';
import { IncidentService } from '@/shared/services/incident.service';
import { formatarData, getCurrentAfterDate, getCurrentBeforeDate, getCurrentDate } from '@/shared/services/util/DateUtil';
import { Component, OnInit } from '@angular/core';
import { TarefaService } from 'src/app/shared/services/tarefa.service';

@Component({
  selector: 'app-stats-widget',
  imports: [],
  templateUrl: './stats-widget.component.html',
  styleUrl: './stats-widget.component.scss'
})
export class StatsWidgetComponent implements OnInit {

  protected quantidadeTarefas = 0;
  protected quantidadeIncidentes = {
    total: 0,
    hoje: 0
  };
  protected quantidadeAssinaturas = {
    totalPendentes: 0,
    totalHoje: 0,
    concluidas: 0,
    pendentes: 0
  };

  private queryAssinatura = {
    taskInvolvedUser: '',
    unfinished: true,
    processVariables: [
      {
        name: 'isAssinatura',
        operator: 'eq',
        value: 'SIM'
      }
    ]
  }
  private queryAssinaturaPendente = {
    taskInvolvedUser: '',
    unfinished: true,
    processVariables: [
      {
        name: 'isAssinatura',
        operator: 'eq',
        value: 'SIM'
      }
    ]
  }
  private queryPendente = {
    taskAssignee: '',
    unfinished: true,
    assigned: true
  }
  protected quantidadeTarefasVenceHoje = 0;

  constructor(
    private readonly incidentService: IncidentService,
    private readonly historyService: HistoryService,
    private readonly tarefaService: TarefaService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    this.tarefaService.quantidadeTarefas().subscribe(response => {
      this.quantidadeTarefas = response.count;
    });
    this.tarefaService.quantidadeTarefasVencemHoje().subscribe(response => {
      this.quantidadeTarefasVenceHoje = response.count;
    })
    this.incidentService.quantidadeIncidentes('open=true&resolved=false').subscribe(response => {
      this.quantidadeIncidentes.total = response.count;
    })
    this.incidentService.quantidadeIncidentes(`incidentTimestampBefore=${formatarData(new Date, true)}&incidentTimestampAfter=${formatarData(new Date, true)}&open=true&resolved=false`).subscribe(response => {
      this.quantidadeIncidentes.hoje = response.count;
    })
    this.contarAssinatura();
  }

  private contarAssinatura() {
    const idUser = this.authService.extrairIdUsuario();
    this.queryAssinatura.taskInvolvedUser = idUser;
    this.queryAssinaturaPendente.taskInvolvedUser = idUser;
    this.queryPendente.taskAssignee = idUser;
    this.historyService.filtrarTarefas(
      this.queryAssinatura
    ).subscribe(response => {
      this.quantidadeAssinaturas.concluidas = response.length;
    });
    this.historyService.filtrarTarefas(
      this.queryAssinaturaPendente
    ).subscribe(response => {
      this.quantidadeAssinaturas.pendentes = response.length;
    });
    this.historyService.filtrarTarefas(
      this.queryPendente
    ).subscribe(response => {
      this.quantidadeAssinaturas.totalPendentes = response.length;
    });
    this.queryPendente['startedBefore'] = getCurrentBeforeDate();
    this.queryPendente['startedAfter'] = getCurrentAfterDate();
    this.historyService.filtrarTarefas(
      this.queryPendente
    ).subscribe(response => {
      this.quantidadeAssinaturas.totalHoje = response.length;
    });
  }
}
