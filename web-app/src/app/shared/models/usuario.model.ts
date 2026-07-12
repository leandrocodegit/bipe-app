
export class Usuario {
  id?: string;
  access: any;
  attributes: any | null;
  requiredActions: any | null;
  emailVerified: boolean = false;
  username: string = '';
  email: string = '';
  firstName?: string;
  lastName?: string | null;
  groups: Grupo[] = [];
  departamentos: Grupo[] = [];
  enabled?: boolean;
  phone: any | null;
  tema?: Tema;
  permissao?: string
}

export interface Grupo {
  id: string;
  name: string;
  description: string;
  nome: string
}

export class Tema {
  dark?: boolean;
  color?: string;
  toggle?: boolean;
}
