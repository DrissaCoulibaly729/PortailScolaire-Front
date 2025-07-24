import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  /**
   * Obtenir les données pour le graphique des performances par matière
   */
  getPerformanceBySubject(): Observable<ChartData> {
    const mockData: ChartData = {
      labels: ['Mathématiques', 'Français', 'Histoire', 'Sciences', 'Anglais'],
      datasets: [{
        label: 'Moyenne par matière',
        data: [14.2, 13.8, 15.1, 12.9, 13.5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ]
      }]
    };

    return of(mockData).pipe(delay(1000));
  }

  /**
   * Obtenir les données d'évolution mensuelle
   */
  getMonthlyEvolution(): Observable<ChartData> {
    const mockData: ChartData = {
      labels: ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'],
      datasets: [{
        label: 'Moyenne générale',
        data: [12.5, 13.1, 13.8, 14.2, 13.9, 14.5, 14.8],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }]
    };

    return of(mockData).pipe(delay(800));
  }

  /**
   * Obtenir la répartition des mentions
   */
  getMentionDistribution(): Observable<ChartData> {
    const mockData: ChartData = {
      labels: ['Excellent', 'Très Bien', 'Bien', 'Assez Bien', 'Passable', 'Insuffisant'],
      datasets: [{
        label: 'Nombre d\'élèves',
        data: [5, 12, 23, 18, 8, 3],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }]
    };

    return of(mockData).pipe(delay(600));
  }
}

// ===== Export de toutes les fonctionnalités =====
export {
  RoleNamePipe,
  GradeMentionPipe,
  TimeAgoPipe,
  FileSizePipe,
  CustomValidators,
  CacheService,
  PdfService,
  EmailService,
  FileDropDirective,
  StatisticsService
};