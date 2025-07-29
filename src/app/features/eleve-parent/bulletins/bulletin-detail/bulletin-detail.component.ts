// src/app/features/eleve-parent/bulletins/bulletin-detail/bulletin-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { EleveParentService } from '../../../../core/services/eleve-parent.service';
import { NotificationService } from '../../../../core/services/notification.service';

import { Bulletin, NoteBulletin } from '../../../../shared/models/bulletin.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-bulletin-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bulletin-detail.component.html',
  styleUrls: ['./bulletin-detail.component.css']
})
export class BulletinDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // État du composant
  bulletin: Bulletin | null = null;
  notesBulletin: NoteBulletin[] = [];
  isLoading = true;
  error = '';
  bulletinId: number = 0;

  // Statistiques calculées
  moyenneGenerale = 0;
  nombreMatieres = 0;
  meilleureNote = 0;
  matiereMeilleure = '';
  noteMinimale = 20;
  matiereMinimale = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eleveParentService: EleveParentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          this.bulletinId = +params['id'];
          if (!this.bulletinId) {
            throw new Error('ID bulletin invalide');
          }
          return this.eleveParentService.getBulletinDetail(this.bulletinId);
        })
      )
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.bulletin = response.data;
            this.notesBulletin = response.data.notes_bulletins || [];
            this.calculateStatistics();
          } else {
            this.error = response.reason || 'Accès non autorisé à ce bulletin';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du bulletin:', error);
          this.error = 'Bulletin non trouvé ou accès non autorisé';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calculer les statistiques du bulletin
   */
  private calculateStatistics(): void {
    if (!this.notesBulletin.length) return;

    this.nombreMatieres = this.notesBulletin.length;
    this.moyenneGenerale = this.bulletin?.moyenne_generale || 0;

    // Trouver la meilleure et la pire note
    let meilleureNote = 0;
    let noteMinimale = 20;
    let matiereMeilleure = '';
    let matiereMinimale = '';

    this.notesBulletin.forEach(note => {
      if (note.moyenne > meilleureNote) {
        meilleureNote = note.moyenne;
        matiereMeilleure = note.matiere_nom;
      }
      if (note.moyenne < noteMinimale) {
        noteMinimale = note.moyenne;
        matiereMinimale = note.matiere_nom;
      }
    });

    this.meilleureNote = meilleureNote;
    this.matiereMeilleure = matiereMeilleure;
    this.noteMinimale = noteMinimale;
    this.matiereMinimale = matiereMinimale;
  }

  /**
   * Télécharger le bulletin en PDF
   */
  downloadPdf(): void {
    if (!this.bulletin) return;

    this.eleveParentService.downloadBulletinPdf(this.bulletin.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.allowed && response.data) {
            this.downloadFile(response.data, `bulletin-${this.bulletin?.periode?.nom || 'bulletin'}.pdf`);
            this.notificationService.success('Succès', 'Bulletin téléchargé avec succès');
          } else {
            this.notificationService.error('Erreur', response.reason || 'Impossible de télécharger le bulletin');
          }
        },
        error: (error) => {
          console.error('Erreur téléchargement:', error);
          this.notificationService.error('Erreur', 'Échec du téléchargement');
        }
      });
  }

  /**
   * Télécharger un fichier blob
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Retourner à la liste des bulletins
   */
  goBack(): void {
    this.router.navigate(['/eleve/bulletins']);
  }

  /**
   * Obtenir la couleur selon la note
   */
  getNoteColor(note: number): string {
    if (note >= 16) return 'text-green-600';
    if (note >= 14) return 'text-blue-600';
    if (note >= 12) return 'text-purple-600';
    if (note >= 10) return 'text-yellow-600';
    if (note >= 8) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Obtenir la couleur de fond selon la note
   */
  getNoteBgColor(note: number): string {
    if (note >= 16) return 'bg-green-50 border-green-200';
    if (note >= 14) return 'bg-blue-50 border-blue-200';
    if (note >= 12) return 'bg-purple-50 border-purple-200';
    if (note >= 10) return 'bg-yellow-50 border-yellow-200';
    if (note >= 8) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  }

  /**
   * Obtenir la mention selon la note
   */
  getMention(note: number): string {
    if (note >= 16) return 'Excellent';
    if (note >= 14) return 'Très bien';
    if (note >= 12) return 'Bien';
    if (note >= 10) return 'Assez bien';
    if (note >= 8) return 'Passable';
    return 'Insuffisant';
  }

  /**
   * Formater une note
   */
  formatNote(note: number): string {
    return note ? note.toFixed(2) : '-';
  }

  /**
   * Obtenir le pourcentage de la note
   */
  getNotePercentage(note: number): number {
    return (note / 20) * 100;
  }

  /**
   * Vérifier si la note est en dessous de la moyenne
   */
  isBelowAverage(note: number): boolean {
    return note < 10;
  }

  /**
   * Vérifier si la note est excellente
   */
  isExcellent(note: number): boolean {
    return note >= 16;
  }
}