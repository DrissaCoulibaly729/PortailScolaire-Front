// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration: number;
  closable: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationId = 0;

  constructor() {}

  /**
   * Afficher une notification de succès
   */
  success(title: string, message: string, options?: NotificationOptions): void {
    this.showNotification('success', title, message, options);
  }

   showSuccess(message: string, options?: NotificationOptions): void {
    this.success('Succès', message, options);
  }

  showError(message: string, options?: NotificationOptions): void {
    this.error('Erreur', message, options);
  }
  /**
   * Afficher une notification d'erreur
   */
  error(title: string, message: string, options?: NotificationOptions): void {
    this.showNotification('error', title, message, options);
  }

  /**
   * Afficher une notification d'avertissement
   */
  warning(title: string, message: string, options?: NotificationOptions): void {
    this.showNotification('warning', title, message, options);
  }

  /**
   * Afficher une notification d'information
   */
  info(title: string, message: string, options?: NotificationOptions): void {
    this.showNotification('info', title, message, options);
  }

  /**
   * Afficher une notification
   */
  private showNotification(
    type: NotificationType, 
    title: string, 
    message: string, 
    options?: NotificationOptions
  ): void {
    const notification: Notification = {
      id: `notification-${++this.notificationId}`,
      type,
      title,
      message,
      timestamp: new Date(),
      duration: options?.duration || (type === 'error' ? 0 : 5000),
      closable: options?.closable !== false,
      action: options?.action
    };

    this.notifications.unshift(notification);

    // Auto-remove après la durée spécifiée
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    // Log dans la console pour le développement
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }

  /**
   * Supprimer une notification
   */
  remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Supprimer toutes les notifications
   */
  clear(): void {
    this.notifications = [];
  }

  /**
   * Obtenir toutes les notifications actives
   */
  getNotifications(): Notification[] {
    return this.notifications;
  }

  /**
   * Vérifier s'il y a des notifications
   */
  hasNotifications(): boolean {
    return this.notifications.length > 0;
  }

  /**
   * Obtenir le nombre de notifications
   */
  getCount(): number {
    return this.notifications.length;
  }

  /**
   * Obtenir les notifications par type
   */
  getByType(type: NotificationType): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  
  
}