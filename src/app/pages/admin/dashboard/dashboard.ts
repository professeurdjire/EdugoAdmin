import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  faBook, faBookMedical,
  faFlagCheckered,
  faMedal,
  faPlusCircle,
  faSquarePollHorizontal,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgApexchartsModule, ApexChart, ApexTitleSubtitle, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexDataLabels, ApexStroke, ApexFill, ApexLegend, ApexNonAxisChartSeries, ApexResponsive } from 'ng-apexcharts';
import { RouterLink } from '@angular/router';
import { StatistiquesService } from '../../../api/api/statistiques.service';
import { StatistiquesPlateformeResponse } from '../../../api/model/statistiquesPlateformeResponse';
import { UsersService } from '../../../services/api/admin/users.service';
import { User } from '../../../api/model/user';
import { LivresService } from '../../../services/api/admin/livres.service';
import { Livre } from '../../../api/model/livre';
import { AdminEleveService, EleveProfile } from '../../../services/api/admin/admin-eleve.service';
import { MatieresService } from '../../../services/api/admin/matieres.service';
import { Matiere } from '../../../api/model/matiere';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    NgApexchartsModule,
    RouterLink,
],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  // Icônes
  protected readonly faFlagCheckered = faFlagCheckered;
  protected readonly faSquarePollHorizontal = faSquarePollHorizontal;
  protected readonly faBook = faBook;
  protected readonly faUsers = faUsers;
  protected readonly faMedal = faMedal;
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faBookMedical = faBookMedical;

  // Statistiques globales
  statistiques?: StatistiquesPlateformeResponse;
  statsLoading = false;
  statsError: string | null = null;

  // Top utilisateurs pour le dashboard
  topUsers: { initials: string; fullName: string; level: string; points: number }[] = [];
  
  // Matières avec leurs couleurs pour la légende dynamique
  matieresWithColors: { nom: string; couleur: string; count: number }[] = [];

  // Configuration typée pour ApexCharts
  public chartOptions: {
    series: any[];
    chart: ApexChart;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    stroke: ApexStroke;
    fill: ApexFill;
    colors: string[];
    legend: ApexLegend;
    title: ApexTitleSubtitle;
  } = {
    series: [
      {
        name: 'Utilisateurs actifs',
        data: [65, 59, 80, 81, 56, 55, 40]
      },
      {
        name: 'Livres actifs',
        data: [28, 48, 40, 19, 86, 27, 90]
      }
    ],
    chart: {
      type: 'bar' as ApexChart['type'],
      height: 340,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    },
    fill: {
      opacity: 1
    },
    colors: ['#6A3FA8', '#4bc0c0'],
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    yaxis: {
      title: {
        text: 'Nombre'
      }
    },
    title: {
      text: undefined
    }
  };

  // Donut: Répartition de lecture par matière
  public readingDonutOptions: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    dataLabels: ApexDataLabels;
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    responsive: ApexResponsive[];
    stroke: ApexStroke;
  } = {
    series: [15, 12, 10, 8, 7, 6, 5, 4],
    chart: {
      type: 'donut',
      height: 200,
      width: 200,
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: true }
    },
    labels: [
      'Mathématiques',
      'Français',
      'Histoires',
      'Géographie',
      'Anglais',
      'ECM',
      'Physique',
      'Chimie'
    ],
    colors: [
      '#4a68f2', // maths
      '#37c75b', // francais
      '#ff914d', // histoires
      '#ff3e3e', // geographie
      '#ffdd00', // anglais
      '#9013fe', // ecm
      '#1b4965', // physique
      '#777'     // chimie
    ],
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2,
      colors: ['#ffffff']
    },
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '55%'
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { height: 220, width: 220 }
        }
      }
    ]
  };

  constructor(
    private statistiquesService: StatistiquesService,
    private usersService: UsersService,
    private livresService: LivresService,
    private adminEleveService: AdminEleveService,
    private matieresService: MatieresService
  ) {}

  ngOnInit(): void {
    this.loadStatistiques();
    this.loadTopUsers();
    this.loadReadingDistribution();
  }

  private loadStatistiques(): void {
    this.statsLoading = true;
    this.statsError = null;
    this.statistiquesService.getStatistiquesPlateforme().subscribe({
      next: (stats) => {
        this.statistiques = stats;
        this.statsLoading = false;
        // Charger les données du graphique une fois les stats disponibles
        this.loadChartData();
      },
      error: (err) => {
        console.error('Erreur chargement statistiques:', err);
        this.statsError = "Impossible de charger les statistiques de la plateforme.";
        this.statsLoading = false;
      }
    });
  }

  private loadTopUsers(): void {
    // Utiliser AdminEleveService pour obtenir les élèves avec leurs points
    this.adminEleveService.listEleves().subscribe({
      next: (eleves: EleveProfile[]) => {
        if (!Array.isArray(eleves) || eleves.length === 0) {
          this.topUsers = [];
          return;
        }

        // Trier les élèves par points décroissants
        const sortedEleves = [...eleves].sort((a, b) => {
          const pointsA = a.pointAccumule ?? 0;
          const pointsB = b.pointAccumule ?? 0;
          return pointsB - pointsA; // Tri décroissant
        });

        // Prendre les top 5
        this.topUsers = sortedEleves
          .slice(0, 5)
          .map(eleve => {
            const firstName = eleve.prenom || '';
            const lastName = eleve.nom || '';
            const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
            const fullName = `${firstName} ${lastName}`.trim();
            return {
              initials: initials || 'U',
              fullName: fullName || (eleve.email || 'Utilisateur'),
              level: eleve.niveauNom || '',
              points: eleve.pointAccumule ?? 0
            };
          });
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs pour le top 5:', err);
        // Fallback sur UsersService si AdminEleveService échoue
        this.usersService.list().subscribe({
          next: (users: User[]) => {
            if (!Array.isArray(users)) {
              this.topUsers = [];
              return;
            }
            const eleves = users.filter(u => u.role === User.RoleEnum.Eleve);
            const baseList = eleves.length > 0 ? eleves : users;
            this.topUsers = baseList.slice(0, 5).map(u => {
              const firstName = u.prenom || '';
              const lastName = u.nom || '';
              const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
              const fullName = `${firstName} ${lastName}`.trim();
              return {
                initials: initials || 'U',
                fullName: fullName || (u.email || 'Utilisateur'),
                level: '',
                points: (u as any).pointAccumule ?? 0
              };
            });
          },
          error: (fallbackErr) => {
            console.error('Erreur fallback chargement utilisateurs:', fallbackErr);
            this.topUsers = [];
          }
        });
      }
    });
  }

  private loadChartData(): void {
    // Charger les données pour le graphique en barres (7 derniers jours)
    // On utilise les statistiques disponibles pour créer des données réalistes
    forkJoin({
      users: this.usersService.list(),
      livres: this.livresService.list()
    }).subscribe({
      next: (data) => {
        const { users, livres } = data;
        const stats = this.statistiques;
        
        // Calculer les données pour les 7 derniers jours
        const last7Days = this.getLast7Days();
        const usersData: number[] = [];
        const livresData: number[] = [];
        const dayLabels: string[] = [];

        // Récupérer les utilisateurs actifs (élèves actifs uniquement)
        const eleves = Array.isArray(users) ? users.filter((u: User) => u.role === User.RoleEnum.Eleve) : [];
        // Filtrer uniquement les élèves actifs - être strict : seulement ceux avec estActive === true ou enabled === true
        // Si estActive/enabled n'est pas défini ou est null, ne pas compter comme actif
        const elevesActifs = eleves.filter((u: User) => {
          // Seulement compter ceux qui ont explicitement estActive === true ou enabled === true
          return u.estActive === true || u.enabled === true;
        });
        // Utiliser le comptage réel des élèves actifs (plus fiable que les statistiques)
        const totalUsers = elevesActifs.length;
        const totalLivresActifs = stats?.livresDisponibles || (Array.isArray(livres) ? livres.length : 0);

        // Noms des jours en français
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        // Afficher les nombres réels d'utilisateurs actifs et de livres actifs
        for (let i = 0; i < 7; i++) {
          const day = last7Days[i];
          
          // Label du jour
          dayLabels.push(dayNames[day.getDay()]);
          
          // Afficher les nombres réels (utilisateurs actifs et livres actifs)
          usersData.push(totalUsers);
          livresData.push(totalLivresActifs);
        }

        // Mettre à jour le graphique
        this.chartOptions = {
          ...this.chartOptions,
          xaxis: {
            ...this.chartOptions.xaxis,
            categories: dayLabels
          },
          series: [
            {
              name: 'Utilisateurs actifs',
              data: usersData
            },
            {
              name: 'Livres actifs',
              data: livresData
            }
          ]
        };
      },
      error: (err) => {
        console.error('Erreur chargement données graphique:', err);
        // En cas d'erreur, on garde les données par défaut
      }
    });
  }

  private loadReadingDistribution(): void {
    // Charger les livres et les matières en parallèle
    forkJoin({
      livres: this.livresService.list(),
      matieres: this.matieresService.list()
    }).subscribe({
      next: (data) => {
        const { livres, matieres } = data;
        if (!Array.isArray(livres) || livres.length === 0) {
          return;
        }

        // Grouper les livres par matière
        const matiereMap = new Map<string, number>();

        livres.forEach(livre => {
          let matiereNom = livre.matiere?.nom || (livre as any).matiereNom || '';
          // Normaliser le nom de la matière
          if (matiereNom) {
            matiereNom = matiereNom.trim();
            // Normaliser la casse et les variations
            matiereNom = this.normalizeMatiereName(matiereNom);
          } else {
            matiereNom = 'Non spécifié';
          }
          const count = matiereMap.get(matiereNom) || 0;
          matiereMap.set(matiereNom, count + 1);
        });

        // Couleurs harmonieuses et douces (s'harmonisent avec le violet #6A3FA8 et les couleurs principales)
        const predefinedColors: { [key: string]: string } = {
          'Mathématiques': '#5B7FB8', // Bleu doux
          'Français': '#6B9E78', // Vert doux
          'Histoires': '#C4A572', // Beige doré
          'Géographie': '#8B8B8B', // Gris doux
          'Anglais': '#A67C94', // Rose poussière
          'ECM': '#8B6FA8', // Violet doux (harmonise avec #6A3FA8)
          'Physique': '#B8875E', // Terre cuite
          'Chimie': '#6B7B8C' // Gris-bleu
        };

        // Générer ou récupérer les couleurs pour toutes les matières
        const matieresWithColors = new Map<string, string>();
        
        // D'abord, assigner les couleurs prédéfinies
        Object.keys(predefinedColors).forEach(matiere => {
          if (matiereMap.has(matiere)) {
            matieresWithColors.set(matiere, predefinedColors[matiere]);
          }
        });

        // Ensuite, générer des couleurs pour les autres matières
        const allMatieres = Array.isArray(matieres) ? matieres : [];
        allMatieres.forEach((matiere: Matiere) => {
          const nom = matiere.nom || '';
          if (nom && !matieresWithColors.has(nom) && matiereMap.has(nom)) {
            matieresWithColors.set(nom, this.generateColorForMatiere(nom));
          }
        });

        // Ajouter les matières non listées dans la base
        matiereMap.forEach((count, matiereNom) => {
          if (!matieresWithColors.has(matiereNom)) {
            matieresWithColors.set(matiereNom, this.generateColorForMatiere(matiereNom));
          }
        });

        // Créer les séries et labels avec couleurs
        const series: number[] = [];
        const labels: string[] = [];
        const colors: string[] = [];
        const matieresData: { nom: string; couleur: string; count: number }[] = [];

        // Trier par nombre de livres (décroissant)
        const sortedMatieres = Array.from(matiereMap.entries()).sort((a, b) => b[1] - a[1]);

        sortedMatieres.forEach(([matiereNom, count]) => {
          if (count > 0) {
            const couleur = matieresWithColors.get(matiereNom) || '#999999';
            series.push(count);
            labels.push(matiereNom);
            colors.push(couleur);
            matieresData.push({ nom: matiereNom, couleur: couleur, count: count });
          }
        });

        // Stocker pour la légende dynamique
        this.matieresWithColors = matieresData;

        // Mettre à jour le graphique donut
        if (series.length > 0) {
          this.readingDonutOptions = {
            ...this.readingDonutOptions,
            series: series,
            labels: labels,
            colors: colors
          };
        }
      },
      error: (err) => {
        console.error('Erreur chargement répartition par matière:', err);
      }
    });
  }

  /**
   * Normalise le nom de la matière pour correspondre aux couleurs prédéfinies
   */
  private normalizeMatiereName(nom: string): string {
    const normalized = nom.trim();
    const lowerNom = normalized.toLowerCase();
    
    // Correspondances pour normaliser les noms
    if (lowerNom.includes('math') || lowerNom.includes('mathématique')) {
      return 'Mathématiques';
    }
    if (lowerNom.includes('français') || lowerNom.includes('francais')) {
      return 'Français';
    }
    if (lowerNom.includes('histoire') || lowerNom.includes('histoires')) {
      return 'Histoires';
    }
    if (lowerNom.includes('géographie') || lowerNom.includes('geographie')) {
      return 'Géographie';
    }
    if (lowerNom.includes('anglais')) {
      return 'Anglais';
    }
    if (lowerNom.includes('ecm')) {
      return 'ECM';
    }
    if (lowerNom.includes('physique')) {
      return 'Physique';
    }
    if (lowerNom.includes('chimie')) {
      return 'Chimie';
    }
    
    // Retourner le nom avec première lettre en majuscule
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  /**
   * Génère une couleur de manière déterministe basée sur le nom de la matière
   * Utilise un hash du nom pour toujours retourner la même couleur pour la même matière
   */
  private generateColorForMatiere(nom: string): string {
    // Palette de couleurs harmonieuses et douces (s'harmonisent avec les couleurs principales)
    // Tons pastels et moins saturés pour un rendu professionnel
    const colorPalette = [
      '#8B6FA8', // Violet doux (harmonise avec #6A3FA8)
      '#7A9EBB', // Bleu ciel doux
      '#6B9E78', // Vert sauge
      '#9B8B9C', // Lavande
      '#A67C94', // Rose poussière
      '#7A8B9C', // Gris-bleu doux
      '#8B7A6B', // Taupe
      '#9B9B7A', // Olive doux
      '#8B8B8B', // Gris moyen
      '#6B7B8C', // Ardoise
      '#7A9B9C', // Bleu-gris pâle
      '#9B7A8B', // Mauve
      '#8B9B7A', // Vert-gris
      '#7A8B7A', // Vert menthe
      '#9B8B7A', // Beige chaud
      '#8B7A9C', // Violet pâle
      '#7A9C8B', // Vert-bleu
      '#9C8B7A', // Caramel
      '#8B9C7A', // Vert pomme doux
      '#7A8B9C'  // Bleu-gris doux
    ];

    // Créer un hash simple du nom
    let hash = 0;
    for (let i = 0; i < nom.length; i++) {
      const char = nom.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en entier 32 bits
    }

    // Retourner une couleur de la palette basée sur le hash
    const index = Math.abs(hash) % colorPalette.length;
    return colorPalette[index];
  }

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }
}
