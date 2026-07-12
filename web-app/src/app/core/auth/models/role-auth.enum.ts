export enum Role {
  ADM = 'ADM',
  AUS = 'AUS',
  CLI = 'CLI',
  CMD = 'CMD',
  SINC = 'SINC',
  COR = 'COR',
  HIS = 'HIS',
  WIFI = 'WIFI',
  AGE = 'AGE',
  DEVIN = 'DEVIN',
  DEVRE = 'DEVRE',
  DEVED = 'DEVED',
  INT = 'INT',
  UNKNOWN = 'UNKNOWN'
}

export const RoleDescriptions: Record<Role, string> = {
  [Role.ADM]: 'Administrador',
  [Role.AUS]: 'Administrar usuários',
  [Role.CLI]: 'Sincronizar',
  [Role.CMD]: 'Enviar comandos',
  [Role.SINC]: 'Remover usuários',
  [Role.WIFI]: 'Alterar conexão WIFI',
  [Role.HIS]: 'Ver histórico',
  [Role.COR]: 'Administrar Cores',
  [Role.AGE]: 'Administrar Agendas',
  [Role.DEVIN]: 'Desativar Dispositivo',
  [Role.DEVRE]: 'Remover Dispositivo',
  [Role.DEVED]: 'Editar Dispositivo',
  [Role.INT]: 'Editar Integração',
  [Role.UNKNOWN]: 'Desconhecido'
};
