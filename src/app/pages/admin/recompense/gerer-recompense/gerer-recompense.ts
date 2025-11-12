import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rewards-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './gerer-recompense.html',
  styleUrls: ['./gerer-recompense.css']
})
export class RewardsManagementComponent implements OnInit {
  activeTab: string = 'badges';

  // Données des badges
  badges = [
    {
      id: 1,
      name: 'Pionnier Digital',
      description: 'Premier utilisateur à terminer 10 livres',
      icon: 'fas fa-compass',
      color: '#A885D8',
      rarity: 'rare',
      requirements: 'Terminer 10 livres',
      userCount: 45,
      unlocked: true
    },
    {
      id: 2,
      name: 'Maître des Quiz',
      description: 'Score parfait sur 25 quiz consécutifs',
      icon: 'fas fa-brain',
      color: '#195a9d',
      rarity: 'epic',
      requirements: '25 quiz parfaits',
      userCount: 12,
      unlocked: false
    },
    {
      id: 3,
      name: 'Explorateur Assidu',
      description: 'Connecté 30 jours consécutifs',
      icon: 'fas fa-calendar-check',
      color: '#28bd7f',
      rarity: 'common',
      requirements: '30 jours de connexion',
      userCount: 289,
      unlocked: true
    },
    {
      id: 4,
      name: 'Gourou des Défis',
      description: 'Complété tous les défis du mois',
      icon: 'fas fa-trophy',
      color: '#ff7900',
      rarity: 'legendary',
      requirements: 'Tous les défis mensuels',
      userCount: 8,
      unlocked: false
    }
  ];

  // Forfaits data
  dataPackages = [
    { dataAmount: '500MB', validity: '7 jours', pointsCost: 1000, stock: 45 },
    { dataAmount: '1GB', validity: '15 jours', pointsCost: 1800, stock: 32 },
    { dataAmount: '2GB', validity: '30 jours', pointsCost: 3200, stock: 18 },
    { dataAmount: '5GB', validity: '30 jours', pointsCost: 7500, stock: 5 }
  ];

  // Configuration des points
  pointsConfig = {
    books: 50,
    quizzes: 25,
    challenges: 100,
    streak: 200
  };

  // Classement
  topUsers = [
    { name: 'Marie Koné', points: 12500, level: 15, avatar: '/assets/avatar1.png' },
    { name: 'Amadou Keita', points: 11800, level: 14, avatar: '/assets/avatar2.png' },
    { name: 'Fatoumata Diallo', points: 11200, level: 13, avatar: '/assets/avatar3.png' },
    { name: 'Jean Traoré', points: 9800, level: 12, avatar: '/assets/avatar4.png' },
    { name: 'Aïcha Bamba', points: 8900, level: 11, avatar: '/assets/avatar5.png' }
  ];

  // Système de niveaux
  levels = [
    { number: 1, name: 'Débutant', threshold: 0, rewards: ['Badge Débutant'] },
    { number: 5, name: 'Explorateur', threshold: 2500, rewards: ['+50MB Data', 'Badge Explorateur'] },
    { number: 10, name: 'Expert', threshold: 7500, rewards: ['+100MB Data', 'Badge Expert', 'Accès VIP'] },
    { number: 15, name: 'Maître', threshold: 15000, rewards: ['+500MB Data', 'Badge Maître', 'Support Prioritaire'] }
  ];

  // Récompenses spéciales
  specialRewards = [
    {
      name: 'Coaching Personnalisé',
      description: 'Session de coaching 1-on-1 avec un expert',
      icon: 'fas fa-user-graduate',
      cost: 5000,
      available: true
    },
    {
      name: 'Certificat d\'Excellence',
      description: 'Certificat numérique signé',
      icon: 'fas fa-award',
      cost: 3000,
      available: true
    },
    {
      name: 'Accès Early',
      description: 'Accès anticipé aux nouvelles fonctionnalités',
      icon: 'fas fa-rocket',
      cost: 2000,
      available: false
    }
  ];

  // Analytics
  analytics = {
    totalPoints: 458920,
    badgesAwarded: 15892,
    dataRedeemed: 245,
    activeUsers: 2458
  };

  ngOnInit() {}

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}