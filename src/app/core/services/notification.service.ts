// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private autoCloseDelay = 5000; // 5 secondes par défaut

  constructor() {}

  /**
   * Obtenir la liste des notifications actives
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Ajouter une notification de succès
   */
  success(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      title,
      message: message || '',
      duration: duration || this.autoCloseDelay
    });
  }

  /**
   * Ajouter une notification d'erreur
   */
  error(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      title,
      message: message || '',
      duration: duration || this.autoCloseDelay
    });
  }

  /**
   * Ajouter une notification d'avertissement
   */
  warning(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      title,
      message: message || '',
      duration: duration || this.autoCloseDelay
    });
  }

  /**
   * Ajouter une notification d'information
   */
  info(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title,
      message: message || '',
      duration: duration || this.autoCloseDelay
    });
  }

  /**
   * Ajouter une notification personnalisée
   */
  addNotification(notification: Notification): void {
    const currentNotifications = this.notifications$.value;
    const newNotifications = [...currentNotifications, notification];
    this.notifications$.next(newNotifications);

    // Auto-remove après la durée spécifiée
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Supprimer une notification
   */
  removeNotification(id: string): void {
    const currentNotifications = this.notifications$.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notifications$.next(filteredNotifications);
  }

  /**
   * Supprimer toutes les notifications
   */
  clearAll(): void {
    this.notifications$.next([]);
  }

  /**
   * Générer un ID unique pour les notifications
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Méthodes utilitaires pour les cas d'usage courants
   */
  
  /**
   * Notification de succès pour création d'entité
   */
  successCreate(entityName: string): void {
    this.success(
      'Création réussie',
      `${entityName} a été créé(e) avec succès`
    );
  }

  /**
   * Notification de succès pour mise à jour d'entité
   */
  successUpdate(entityName: string): void {
    this.success(
      'Modification réussie',
      `${entityName} a été modifié(e) avec succès`
    );
  }

  /**
   * Notification de succès pour suppression d'entité
   */
  successDelete(entityName: string): void {
    this.success(
      'Suppression réussie',
      `${entityName} a été supprimé(e) avec succès`
    );
  }

  /**
   * Notification d'erreur pour échec de création
   */
  errorCreate(entityName: string, error?: string): void {
    this.error(
      'Échec de création',
      `Impossible de créer ${entityName}. ${error || ''}`
    );
  }

  /**
   * Notification d'erreur pour échec de mise à jour
   */
  errorUpdate(entityName: string, error?: string): void {
    this.error(
      'Échec de modification',
      `Impossible de modifier ${entityName}. ${error || ''}`
    );
  }

  /**
   * Notification d'erreur pour échec de suppression
   */
  errorDelete(entityName: string, error?: string): void {
    this.error(
      'Échec de suppression',
      `Impossible de supprimer ${entityName}. ${error || ''}`
    );
  }

  /**
   * Notification d'erreur de validation
   */
  validationError(message: string = 'Veuillez corriger les erreurs dans le formulaire'): void {
    this.warning(
      'Erreurs de validation',
      message
    );
  }

  /**
   * Notification d'erreur de permission
   */
  permissionError(): void {
    this.error(
      'Accès refusé',
      'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
    );
  }

  /**
   * Notification d'erreur de connexion
   */
  connectionError(): void {
    this.error(
      'Erreur de connexion',
      'Impossible de contacter le serveur. Vérifiez votre connexion internet'
    );
  }

  showSuccess(message: string, duration?: number): void {
    this.success('Succès', message, duration);
  }

  showError(message: string, duration?: number): void {
    this.error('Erreur', message, duration);
  }
}