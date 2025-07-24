import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Show a success notification
   */
  success(title: string, message?: string, duration: number = 5000): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Show an error notification
   */
  error(title: string, message?: string, duration: number = 8000): void {
    this.show({
      type: 'error',
      title,
      message,
      duration
    });
  }

  /**
   * Show a warning notification
   */
  warning(title: string, message?: string, duration: number = 6000): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Show an info notification
   */
  info(title: string, message?: string, duration: number = 5000): void {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Show a custom notification
   */
  show(data: Omit<NotificationData, 'id'>): void {
    const notification: NotificationData = {
      id: this.generateId(),
      dismissible: true,
      ...data
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string): void {
    const current = this.notificationsSubject.value;
    const filtered = current.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notificationsSubject.next([]);
  }
}