export interface Niveau {
  id?: number;
  nom: string;
  classes?: Classe[];
  livres?: Livre[];
}

// forward declarations to avoid import cycles in quick scaffolding
export interface Classe { id?: number; nom: string; niveau?: Partial<Niveau>; }
export interface Livre { id?: number; titre: string; }
