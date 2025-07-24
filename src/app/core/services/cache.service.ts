import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expirationTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultExpirationTime = 5 * 60 * 1000; // 5 minutes

  /**
   * Mettre en cache une valeur
   */
  set<T>(key: string, data: T, expirationTime?: number): void {
    const expiration = expirationTime || this.defaultExpirationTime;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expirationTime: expiration
    };
    
    this.cache.set(key, cacheItem);
  }

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | null {
    const cacheItem = this.cache.get(key);
    
    if (!cacheItem) return null;
    
    const isExpired = Date.now() - cacheItem.timestamp > cacheItem.expirationTime;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cacheItem.data;
  }

  /**
   * Vérifier si une clé existe et n'est pas expirée
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Wrapper pour les appels HTTP avec cache automatique
   */
  getOrSet<T>(key: string, factory: () => Observable<T>, expirationTime?: number): Observable<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return of(cached);
    }
    
    return factory().pipe(
      tap(data => this.set(key, data, expirationTime))
    );
  }
}
