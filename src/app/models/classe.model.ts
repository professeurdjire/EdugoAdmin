import { Niveau } from './niveau.model';

export interface Classe {
  id?: number;
  nom: string;
  niveau?: Partial<Niveau> | number;
}
