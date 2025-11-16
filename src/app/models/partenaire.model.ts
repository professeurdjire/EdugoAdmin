export interface Partenaire {
  id?: number;
  nom: string;
  domaine: string;
  type: string;
  autreType?: string;
  email: string;
  telephone?: string;
  siteWeb?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  autrePays?: string;
  statut: string;
  dateDebut?: string;
  dateAjout?: string;
  dateCreation?: string;
  description?: string;
  newsletter: boolean;
  actif?: boolean;
}