import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TimeAgoPipe } from './time-ago.pipe';
import { AdminAccountService, AdminNotification } from '../../../services/api/admin/admin-account.service';

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
  @Output() unreadCountChange = new EventEmitter<number>();

  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  currentFilter: string = 'all';

  constructor(private adminAccount: AdminAccountService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  private loadNotifications() {
    this.adminAccount.getNotifications().subscribe({
      next: (items: AdminNotification[]) => {
        this.notifications = items.map(n => ({
          id: n.id,
          type: (n.type as any) || 'system',
          category: n.type || 'system',
          senderName: '',
          message: n.message,
          timestamp: new Date(n.dateCreation),
          read: n.lu,
          priority: 'low'
        }));
        this.applyFilter(this.currentFilter || 'all');
        this.emitUnreadCount();
      },
      error: (err) => {
        console.error('Erreur chargement notifications admin:', err);
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

  private emitUnreadCount() {
    this.unreadCountChange.emit(this.getUnreadCount());
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.onClose();
  }
}