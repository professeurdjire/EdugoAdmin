import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TimeAgoPipe } from './time-ago.pipe';
import { AdminAccountService, AdminNotification } from '../../../services/api/admin/admin-account.service';
import { Suggestion } from '../../../api/model/suggestion';

// Types de notifications supportés
type NotificationType = 
  | 'NOUVEAU_CHALLENGE'
  | 'NOUVEAU_DEFI'
  | 'NOUVEAU_LIVRE'
  | 'NOUVEAU_QUIZ'
  | 'OBJECTIF_ATTEINT'
  | 'BADGE_OBTENU'
  | 'RAPPEL_DEADLINE'
  | 'NOUVEAU_MESSAGE_ADMIN'
  | 'REPONSE_SUGGESTION'
  | 'AMELIORATION_CLASSEMENT'
  | 'suggestion'; // Pour la rétrocompatibilité

interface Notification {
  id: number;
  type: NotificationType;
  category: string;
  senderName: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  attachment?: boolean;
  // Données supplémentaires optionnelles
  data?: any;
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
  @Output() unreadCountChange = new EventEmitter<number>();

  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  currentFilter: string = 'all';
  loading: boolean = false;
  error: string | null = null;

  constructor(private adminAccount: AdminAccountService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  private loadSuggestions(): void {
    this.adminAccount.getSuggestions().subscribe({
      next: (suggestions: Suggestion[]) => {
        console.log('Suggestions reçues de l\'API:', suggestions);
        
        const suggestionNotifications: Notification[] = suggestions
          .filter(s => s) // Filtrer les suggestions nulles
          .map(s => ({
            id: s.id!,
            type: 'suggestion',
            category: 'suggestion',
            senderName: ((s.eleve?.prenom ?? '') + ' ' + (s.eleve?.nom ?? '')).trim() || 'Suggestion élève',
            message: s.contenu?.substring(0, 100) || 'Nouvelle suggestion',
            timestamp: s.dateEnvoie ? new Date(s.dateEnvoie) : new Date(),
            read: false,
            priority: 'low'
          }));

        this.notifications = [...this.notifications, ...suggestionNotifications];
        this.applyFilter(this.currentFilter || 'all');
        this.emitUnreadCount();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des suggestions:', err);
        this.loading = false;
      }
    });
  }

  private loadNotifications() {
    this.loading = true;
    this.error = null;
    this.notifications = [];

    // D'abord charger les notifications standard
    this.adminAccount.getNotifications().subscribe({
      next: (items: AdminNotification[]) => {
        console.log('Notifications reçues de l\'API:', items);
        
        const baseNotifications: Notification[] = items.map(n => {
          if (!n) {
            console.warn('Notification invalide reçue:', n);
            return null;
          }
          
          try {
            // Déterminer le type de notification et formater le message en conséquence
            const notificationType = n.type as NotificationType;
            let message = n.message || 'Nouvelle notification';
            let senderName = n.titre || 'Système';
            let priority: 'low' | 'medium' | 'high' = 'low';
            
            // Personnalisation en fonction du type de notification
            switch(notificationType) {
              case 'NOUVEAU_CHALLENGE':
                message = n.message || 'Un nouveau challenge est disponible !';
                priority = 'high';
                break;
              case 'NOUVEAU_DEFI':
                message = n.message || 'Un nouveau défi vous attend !';
                priority = 'high';
                break;
              case 'OBJECTIF_ATTEINT':
                message = n.message || 'Félicitations ! Vous avez atteint un objectif.';
                priority = 'high';
                break;
              case 'BADGE_OBTENU':
                message = n.message || 'Nouveau badge débloqué !';
                priority = 'high';
                break;
              case 'RAPPEL_DEADLINE':
                message = n.message || 'Rappel : Échéance proche pour un de vos défis';
                priority = 'medium';
                break;
              case 'NOUVEAU_MESSAGE_ADMIN':
                senderName = 'Administration';
                priority = 'high';
                break;
            }
            
            return {
              id: n.id,
              type: notificationType,
              category: this.getNotificationCategory(notificationType),
              senderName: senderName,
              message: message,
              timestamp: n.dateCreation ? new Date(n.dateCreation) : new Date(),
              read: n.lu || false,
              priority: priority,
              data: n // Conserver les données brutes
            };
          } catch (error) {
            console.error('Erreur lors du mappage d\'une notification:', error, n);
            return null;
          }
        }).filter((n): n is Notification & { data: AdminNotification } => n !== null);

        this.notifications = [...baseNotifications];
        this.applyFilter(this.currentFilter || 'all');
        this.emitUnreadCount();
        
        // Ensuite charger les suggestions
        this.loadSuggestions();
      },
      error: (err) => {
        console.error('Erreur chargement notifications admin:', err);
        this.error = `Erreur lors du chargement des notifications: ${err.message || 'Erreur inconnue'}`;
        
        // Essayer de charger quand même les suggestions
        this.loadSuggestions();
      }
    });
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
    this.emitUnreadCount();
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
      this.adminAccount.markNotificationAsRead(notificationId).subscribe({
        next: () => {
          notification.read = true;
          this.applyFilter(this.currentFilter);
        },
        error: (err) => {
          console.error('Erreur marquage notification comme lue:', err);
        }
      });
    }
  }

  markAllAsRead() {
    const unread = this.notifications.filter(n => !n.read);
    if (unread.length === 0) {
      return;
    }
    // Marquer chaque notification non lue côté backend
    unread.forEach(n => {
      this.adminAccount.markNotificationAsRead(n.id).subscribe({
        next: () => {
          n.read = true;
          this.applyFilter(this.currentFilter);
        },
        error: (err) => console.error('Erreur marquage notification comme lue:', err)
      });
    });
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

  getCategoryIcon(type: string): string {
    const icons: { [key: string]: string } = {
      // Notifications standards
      'suggestion': 'fas fa-lightbulb',
      'message': 'fas fa-envelope',
      'feedback': 'fas fa-comment',
      'update': 'fas fa-sync',
      'security': 'fas fa-shield-alt',
      'system': 'fas fa-cog',
      'user': 'fas fa-user',
      
      // Nouvelles notifications
      'NOUVEAU_CHALLENGE': 'fas fa-trophy',
      'NOUVEAU_DEFI': 'fas fa-flag-checkered',
      'NOUVEAU_LIVRE': 'fas fa-book',
      'NOUVEAU_QUIZ': 'fas fa-question-circle',
      'OBJECTIF_ATTEINT': 'fas fa-bullseye',
      'BADGE_OBTENU': 'fas fa-award',
      'RAPPEL_DEADLINE': 'fas fa-clock',
      'NOUVEAU_MESSAGE_ADMIN': 'fas fa-envelope-open-text',
      'REPONSE_SUGGESTION': 'fas fa-reply',
      'AMELIORATION_CLASSEMENT': 'fas fa-chart-line'
    };
    return icons[type] || 'fas fa-bell';
  }

  private getNotificationCategory(type: NotificationType): string {
    const categories: { [key: string]: string } = {
      'NOUVEAU_CHALLENGE': 'challenge',
      'NOUVEAU_DEFI': 'defi',
      'NOUVEAU_LIVRE': 'livre',
      'NOUVEAU_QUIZ': 'quiz',
      'OBJECTIF_ATTEINT': 'success',
      'BADGE_OBTENU': 'badge',
      'RAPPEL_DEADLINE': 'warning',
      'NOUVEAU_MESSAGE_ADMIN': 'admin',
      'REPONSE_SUGGESTION': 'suggestion',
      'AMELIORATION_CLASSEMENT': 'ranking',
      'suggestion': 'suggestion'
    };
    return categories[type] || 'system';
  }

  getCategoryClass(category: string): string {
    // Retourne une classe CSS basée sur la catégorie
    const classes: { [key: string]: string } = {
      'challenge': 'category-challenge',
      'defi': 'category-defi',
      'livre': 'category-livre',
      'quiz': 'category-quiz',
      'success': 'category-success',
      'badge': 'category-badge',
      'warning': 'category-warning',
      'admin': 'category-admin',
      'suggestion': 'category-suggestion',
      'ranking': 'category-ranking',
      'system': 'category-system'
    };
    return classes[category] || '';
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private emitUnreadCount() {
    this.unreadCountChange.emit(this.getUnreadCount());
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.onClose();
  }
}