export const PT_BR = {
  firstDayOfWeek: 0,
  dayNames: ['Domingo','Segunda','Tterça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['dom','seg','ter','qua','qui','sex','sáb'],
  dayNamesMin: ['D','S','T','Q','Q','S','S'],
  monthNames: [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ],
  monthNamesShort: [
    'jan','fev','mar','abr','mai','jun',
    'jul','ago','set','out','nov','dez'
  ],
  today: 'Hoje',
  clear: 'Limpar'
};

export function getCurrentBeforeDate(): string {
  const date = new Date();

  const pad = (n: number, length = 2) => n.toString().padStart(length, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  const hours = 23;
  const minutes = 59;
  const seconds = 59;
  const millis = 0;

  const offset = -date.getTimezoneOffset(); // em minutos
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);

  const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offsetHours}${offsetMinutes}`;
  return formatted;
}

export function getCurrentAfterDate(): string {
  const date = new Date();

  const pad = (n: number, length = 2) => n.toString().padStart(length, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  const hours = 0;
  const minutes = 0;
  const seconds = 0;
  const millis = 0;

  const offset = -date.getTimezoneOffset(); // em minutos
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);

  const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offsetHours}${offsetMinutes}`;
  return formatted;
}

export function getCurrentPlusDate(daysToAdd: number = 0) {
  const date = new Date();

  // Incrementa ou decrementa os dias
  if (daysToAdd !== 0) {
    date.setDate(date.getDate() + daysToAdd);
  }

  return date;
}

export function getCurrentDate(daysToAdd: number = 0, forceZeroHoras?: boolean): string {
  const date = new Date();

  // Incrementa ou decrementa os dias
  if (daysToAdd !== 0) {
    date.setDate(date.getDate() + daysToAdd);
  }

  const pad = (n: number, length = 2) => n.toString().padStart(length, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  // Mantendo sua lógica de zerar o tempo (start of day)
  const hours = "00";
  const minutes = "00";
  const seconds = "00";
  const millis = "000";

  const offset = -date.getTimezoneOffset(); // em minutos
  const sign = offset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  if (forceZeroHoras)
    return `${year}-${month}-${day}T00:00:00.00${sign}${offsetHours}${offsetMinutes}`;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}${sign}${offsetHours}${offsetMinutes}`;
}

export function formatarDataAfter(data: Date) {

  if (data == undefined || !(data instanceof Date))
    return;

  data.setDate(data.getDate() - 1);

  const pad = (n: number) => String(n).padStart(2, '0');

  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());

  const offsetMin = data.getTimezoneOffset(); // em minutos
  const offsetSinal = offsetMin <= 0 ? '+' : '-';
  const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offsetM = pad(Math.abs(offsetMin) % 60);

    return `${ano}-${mes}-${dia}T00:00:01.00${offsetSinal}${offsetH}${offsetM}`;
}

export function formatarDataBefore(data: Date) {

  if (data == undefined || !(data instanceof Date))
    return;

   data.setDate(data.getDate() + 1);

  const pad = (n: number) => String(n).padStart(2, '0');

  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());

  const offsetMin = data.getTimezoneOffset(); // em minutos
  const offsetSinal = offsetMin <= 0 ? '+' : '-';
  const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offsetM = pad(Math.abs(offsetMin) % 60);

    return `${ano}-${mes}-${dia}T00:00:00.00${offsetSinal}${offsetH}${offsetM}`;
}


export function formatarData(data: Date, forceZeroHoras?: boolean): string {


  if (data == undefined || !(data instanceof Date))
    return '';

  const pad = (n: number) => String(n).padStart(2, '0');

  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());
  const hora = pad(data.getHours());
  const min = pad(data.getMinutes());
  const seg = pad(data.getSeconds());
  const ms = String(data.getMilliseconds()).padStart(3, '0');

  const offsetMin = data.getTimezoneOffset(); // em minutos
  const offsetSinal = offsetMin <= 0 ? '+' : '-';
  const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offsetM = pad(Math.abs(offsetMin) % 60);

  if (forceZeroHoras)
    return `${ano}-${mes}-${dia}T00:00:00.00${offsetSinal}${offsetH}${offsetM}`;
  return `${ano}-${mes}-${dia}T${hora}:${min}:${seg}.${ms}${offsetSinal}${offsetH}${offsetM}`;
}

export function formatarDataSimples(data?: Date) {


  if (data == undefined || !(data instanceof Date))
    return;

  const pad = (n: number) => String(n).padStart(2, '0');

  const ano = data.getFullYear();
  const mes = pad(data.getMonth() + 1);
  const dia = pad(data.getDate());

  return `${ano}-${mes}-${dia}`;
}

export function formatarDataForm(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  const dia = pad(data.getDate());
  const mes = pad(data.getMonth() + 1);
  const ano = data.getFullYear();

  return `${ano}-${mes}-${dia}`;
}

export function formatarDataTimeForm(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  const dia = pad(data.getDate());
  const mes = pad(data.getMonth() + 1);
  const ano = data.getFullYear();

  const hora = pad(data.getHours());
  const min = pad(data.getMinutes());
  const seg = pad(data.getSeconds());

  return `${ano}-${mes}-${dia} ${hora}:${min}:${seg}`;
}

export function getRange30Days(baseDate: Date = new Date()) {
  // Criamos cópias para não alterar a data original (imutabilidade)
  const after = new Date(baseDate);
  const before = new Date(baseDate);

  // Ajustamos os dias (+30 e -30)
  after.setDate(baseDate.getDate() - 30);
  before.setDate(baseDate.getDate() + 30);

  return {
    creationDateAfter: after, // 30 dias atrás
    creationDateBefore: before // 30 dias à frente
  };
}

export function formatarHora(data: any) {

  if (data == undefined)
    return null;

  if(!(data instanceof Date))
    return data;

  const pad = (n: number) => String(n).padStart(2, '0');

  const hora = pad(data.getHours());
  const min = pad(data.getMinutes());

  return `${hora}:${min}:00`;
}
