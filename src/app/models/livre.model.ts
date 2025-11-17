import { Niveau } from './niveau.model';
import { Classe } from './classe.model';
import { Matiere } from './matiere.model';

export interface Livre {
  id?: number;
  titre: string;
  auteur?: string;
  editeur?: string;
  description?: string;
  totalPages?: number;
  niveau?: Partial<Niveau> | number;
  classe?: Partial<Classe> | number;
  matiere?: Partial<Matiere> | number;
}
