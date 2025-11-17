import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TimeAgoPipe } from "./time-ago.pipe";

interface Notification {
  id: number;
  type: 'suggestion' | 'message' | 'system' | 'alert' | 'user';
  category: string;
  senderName: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  attachment?: boolean;
}

@Component({
  selector: 'app-notifications-modal',
  standalone:true,
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class NotificationsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  currentFilter: string = 'all';

  constructor() {}

  ngOnInit() {
    this.loadSampleNotifications();
    this.applyFilter('all');
  }

  loadSampleNotifications() {
    this.notifications = [
      {
        id: 1,
        type: 'suggestion',
        category: 'suggestion',
        senderName: 'Marie Dubois',
        message: 'Suggère d\'ajouter des exercices interactifs en mathématiques pour le niveau 6ème',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
        priority: 'medium',
        attachment: true
      },
      {
        id: 2,
        type: 'message',
        category: 'message',
        senderName: 'Support Technique',
        message: 'Votre demande de maintenance a été traitée. Le serveur est maintenant opérationnel.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: true,
        priority: 'high'
      },
      {
        id: 3,
        type: 'user',
        category: 'feedback',
        senderName: 'Jean Martin',
        message: 'Nouveau feedback reçu sur le module de physique-chimie : "Interface très intuitive !"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        priority: 'low'
      },
      {
        id: 4,
        type: 'system',
        category: 'update',
        senderName: 'Système',
        message: 'Mise à jour automatique terminée. Version 2.1.4 déployée avec succès.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        priority: 'medium'
      },
      {
        id: 5,
        type: 'alert',
        category: 'security',
        senderName: 'Sécurité',
        message: 'Connexion détectée depuis un nouvel appareil. Veuillez vérifier votre activité.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: false,
        priority: 'high'
      }
    ];
  }

  applyFilter(filter: string) {
    this.currentFilter = filter;
    
    switch(filter) {
      case 'all':
        this.filteredNotifications = [...this.notifications];
        break;
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.read);
        break;
      case 'suggestions':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'suggestion');
        break;
      default:
        this.filteredNotifications = [...this.notifications];
    }
    
    // Trier par date (plus récent en premier)
    this.filteredNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  setFilter(filter: string) {
    this.applyFilter(filter);
  }

  onClose() {
    this.close.emit();
  }

  markAsRead(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.applyFilter(this.currentFilter);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(notification => notification.read = true);
    this.applyFilter(this.currentFilter);
  }

  archiveNotification(notificationId: number) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.applyFilter(this.currentFilter);
  }

  openAllNotifications() {
    this.onClose();
    // Navigation vers la page complète des notifications
    // this.router.navigate(['/notifications']);
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'suggestion': 'fas fa-lightbulb',
      'message': 'fas fa-envelope',
      'feedback': 'fas fa-comment',
      'update': 'fas fa-sync',
      'security': 'fas fa-shield-alt',
      'system': 'fas fa-cog',
      'user': 'fas fa-user'
    };
    return icons[category] || 'fas fa-bell';
  }

  getCategoryClass(category: string): string {
    return category;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.onClose();
  }
}