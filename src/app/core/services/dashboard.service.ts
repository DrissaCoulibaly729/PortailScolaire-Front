// ===== src/app/core/services/dashboard.service.ts =====
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { DashboardStats, StatistiquesAvancees } from '../../shared/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private apiService: ApiService) { }

  /**
   * Récupérer les statistiques principales du dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.apiService.get<DashboardStats>(API_ENDPOINTS.ADMIN.DASHBOARD);
  }

  /**
   * Récupérer les statistiques avancées pour les graphiques
   */
  getAdvancedStats(): Observable<StatistiquesAvancees> {
    return this.apiService.get<StatistiquesAvancees>(API_ENDPOINTS.ADMIN.STATS_AVANCEES);
  }

  /**
   * Récupérer les données pour le graphique d'activité mensuelle
   */
  getMonthlyActivity(): Observable<any[]> {
    // Cette méthode peut être appelée depuis getAdvancedStats() 
    // ou être un endpoint séparé selon votre API
    return this.apiService.get<any[]>('/admin/dashboard/activite-mensuelle');
  }

  /**
   * Récupérer les données de répartition par classe
   */
  getClassDistribution(): Observable<any[]> {
    return this.apiService.get<any[]>('/admin/dashboard/repartition-classes');
  }

  /**
   * Récupérer l'évolution des inscriptions
   */
  getRegistrationTrend(): Observable<any[]> {
    return this.apiService.get<any[]>('/admin/dashboard/evolution-inscriptions');
  }
}