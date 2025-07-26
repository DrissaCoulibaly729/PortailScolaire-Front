// src/app/features/enseignant/export/export.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from '../../../shared/models/auth.model';

// Interfaces pour l'export
interface OptionsExport {
  format: 'pdf' | 'excel' | 'csv';
  type: 'notes' | 'bulletins' | 'liste_eleves' | 'statistiques' | 'releve_notes';
  periode?: string;
  classe_id?: number;
  eleve_id?: number;
  matiere_id?: number;
  date_debut?: string;
  date_fin?: string;
  inclure_moyennes: boolean;
  inclure_rang: boolean;
  inclure_commentaires: boolean;
  inclure_statistiques: boolean;
  inclure_graphiques: boolean;
  orientation?: 'portrait' | 'paysage';
  taille_page?: 'A4' | 'A3' | 'Letter';
}

interface ModeleExport {
  id: string;
  nom: string;
  description: string;
  type: string;
  format: string[];
  apercu_url?: string;
  options_disponibles: string[];
}

interface ExportJob {
  id: string;
  nom: string;
  statut: 'en_cours' | 'termine' | 'erreur';
  progression: number;
  url_telechargement?: string;
  date_creation: string;
  taille_fichier?: string;
}

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Export & Impression</h1>
            <p class="text-gray-600 mt-2">Exportez et imprimez vos données scolaires</p>
          </div>
          <div class="flex space-x-3">
            <button routerLink="/enseignant/dashboard" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Retour
            </button>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="bg-white rounded-lg shadow-sm border mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex" aria-label="Tabs">
            <button (click)="activeTab = 'nouveau'" 
                    [class]="activeTab === 'nouveau' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
              Nouvel export
            </button>
            <button (click)="activeTab = 'modeles'" 
                    [class]="activeTab === 'modeles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
              Modèles
            </button>
            <button (click)="activeTab = 'historique'" 
                    [class]="activeTab === 'historique' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
              Historique
            </button>
          </nav>
        </div>
      </div>

      <!-- Onglet Nouvel Export -->
      <div *ngIf="activeTab === 'nouveau'">
        <form [formGroup]="exportForm" (ngSubmit)="genererExport()">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Configuration de l'export -->
            <div class="lg:col-span-2">
              <div class="bg-white rounded-lg shadow-sm border p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-6">Configuration de l'export</h3>
                
                <!-- Type d'export -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Type d'export <span class="text-red-500">*</span>
                    </label>
                    <select formControlName="type" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Sélectionnez un type</option>
                      <option value="notes">Liste des notes</option>
                      <option value="bulletins">Bulletins de notes</option>
                      <option value="liste_eleves">Liste des élèves</option>
                      <option value="statistiques">Rapport statistiques</option>
                      <option value="releve_notes">Relevé de notes</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Format <span class="text-red-500">*</span>
                    </label>
                    <select formControlName="format" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Choisir un format</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>

                <!-- Filtres -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Classe</label>
                    <select formControlName="classe_id" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Toutes les classes</option>
                      <option *ngFor="let classe of classes" [value]="classe.id">{{ classe.nom }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Matière</label>
                    <select formControlName="matiere_id" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Toutes les matières</option>
                      <option *ngFor="let matiere of matieres" [value]="matiere.id">{{ matiere.nom }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                    <input type="date" 
                           formControlName="date_debut"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                    <input type="date" 
                           formControlName="date_fin"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>

                <!-- Options d'inclusion -->
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-3">Options d'inclusion</label>
                  <div class="space-y-2">
                    <label class="flex items-center">
                      <input type="checkbox" formControlName="inclure_moyennes" 
                             class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                      <span class="ml-2 text-sm text-gray-700">Inclure les moyennes</span>
                    </label>
                    <label class="flex items-center">
                      <input type="checkbox" formControlName="inclure_rang" 
                             class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                      <span class="ml-2 text-sm text-gray-700">Inclure le classement</span>
                    </label>
                    <label class="flex items-center">
                      <input type="checkbox" formControlName="inclure_commentaires" 
                             class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                      <span class="ml-2 text-sm text-gray-700">Inclure les commentaires</span>
                    </label>
                    <label class="flex items-center">
                      <input type="checkbox" formControlName="inclure_statistiques" 
                             class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                      <span class="ml-2 text-sm text-gray-700">Inclure les statistiques</span>
                    </label>
                    <label class="flex items-center">
                      <input type="checkbox" formControlName="inclure_graphiques" 
                             class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                      <span class="ml-2 text-sm text-gray-700">Inclure les graphiques</span>
                    </label>
                  </div>
                </div>

                <!-- Options PDF -->
                <div *ngIf="exportForm.get('format')?.value === 'pdf'">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                      <select formControlName="orientation" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="portrait">Portrait</option>
                        <option value="paysage">Paysage</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Taille de page</label>
                      <select formControlName="taille_page" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="Letter">Letter</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button type="button" (click)="previsualiser()" 
                          [disabled]="exportForm.invalid"
                          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                    Prévisualiser
                  </button>
                  <button type="submit" 
                          [disabled]="exportForm.invalid || isExporting"
                          class="px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center">
                    <div *ngIf="isExporting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {{ isExporting ? 'Génération...' : 'Générer l\'export' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Aperçu -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>
                
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  <p class="text-gray-500">Sélectionnez les options pour voir l'aperçu</p>
                </div>

                <!-- Informations sur l'export -->
                <div class="mt-6 space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Type :</span>
                    <span class="text-gray-900">{{ getTypeLabel(exportForm.get('type')?.value) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Format :</span>
                    <span class="text-gray-900">{{ getFormatLabel(exportForm.get('format')?.value) }}</span>
                  </div>
                  <div class="flex justify-between text-sm" *ngIf="exportForm.get('classe_id')?.value">
                    <span class="text-gray-600">Classe :</span>
                    <span class="text-gray-900">{{ getClasseNom(exportForm.get('classe_id')?.value) }}</span>
                  </div>
                  <div class="flex justify-between text-sm" *ngIf="exportForm.get('matiere_id')?.value">
                    <span class="text-gray-600">Matière :</span>
                    <span class="text-gray-900">{{ getMatiereNom(exportForm.get('matiere_id')?.value) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Onglet Modèles -->
      <div *ngIf="activeTab === 'modeles'">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let modele of modeles" 
               class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
               (click)="utiliserModele(modele)">
            
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">{{ modele.nom }}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ modele.type }}
                </span>
              </div>
              
              <p class="text-gray-600 text-sm mb-4">{{ modele.description }}</p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <span *ngFor="let format of modele.format" 
                      class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {{ format.toUpperCase() }}
                </span>
              </div>
              
              <div class="flex justify-between items-center">
                <button (click)="previsualiserModele(modele); $event.stopPropagation()" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Prévisualiser
                </button>
                <button (click)="utiliserModele(modele); $event.stopPropagation()" 
                        class="px-3 py-1 border border-blue-300 rounded text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                  Utiliser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Historique -->
      <div *ngIf="activeTab === 'historique'">
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom du fichier
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taille
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let export of historiqueExports" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ export.nom }}</div>
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="{
                            'bg-green-100 text-green-800': export.statut === 'termine',
                            'bg-yellow-100 text-yellow-800': export.statut === 'en_cours',
                            'bg-red-100 text-red-800': export.statut === 'erreur'
                          }">
                      {{ getStatutLabel(export.statut) }}
                    </span>
                    
                    <!-- Barre de progression pour les exports en cours -->
                    <div *ngIf="export.statut === 'en_cours'" class="mt-2">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" [style.width.%]="export.progression"></div>
                      </div>
                      <span class="text-xs text-gray-500">{{ export.progression }}%</span>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ export.date_creation | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ export.taille_fichier || 'N/A' }}
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <button *ngIf="export.statut === 'termine' && export.url_telechargement" 
                              (click)="telechargerExport(export)" 
                              class="text-blue-600 hover:text-blue-900" 
                              title="Télécharger">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </button>
                      
                      <button (click)="supprimerExport(export)" 
                              class="text-red-600 hover:text-red-900" 
                              title="Supprimer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty state -->
                <tr *ngIf="historiqueExports.length === 0">
                  <td colspan="5" class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun export</h3>
                    <p class="text-gray-500">Vous n'avez pas encore créé d'export.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExportComponent implements OnInit {
  activeTab: 'nouveau' | 'modeles' | 'historique' = 'nouveau';
  exportForm: FormGroup;
  isExporting = false;

  // Données
  classes: any[] = [];
  matieres: any[] = [];
  modeles: ModeleExport[] = [];
  historiqueExports: ExportJob[] = [];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.exportForm = this.fb.group({
      type: ['', Validators.required],
      format: ['', Validators.required],
      classe_id: [''],
      matiere_id: [''],
      date_debut: [''],
      date_fin: [''],
      inclure_moyennes: [true],
      inclure_rang: [false],
      inclure_commentaires: [true],
      inclure_statistiques: [false],
      inclure_graphiques: [false],
      orientation: ['portrait'],
      taille_page: ['A4']
    });
  }

  ngOnInit(): void {
    this.loadOptions();
    this.loadModeles();
    this.loadHistorique();
    this.checkRouteParams();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['classe_id']) {
        this.exportForm.patchValue({ classe_id: params['classe_id'] });
      }
    });
  }

  private loadOptions(): void {
    // Mock data
    this.classes = [
      { id: 1, nom: '6ème A' },
      { id: 2, nom: '5ème B' },
      { id: 3, nom: 'Terminale C' }
    ];

    this.matieres = [
      { id: 1, nom: 'Mathématiques' },
      { id: 2, nom: 'Physique' },
      { id: 3, nom: 'Français' }
    ];
  }

  private loadModeles(): void {
    // Mock data
    this.modeles = [
      {
        id: 'modele_notes_standard',
        nom: 'Liste de notes standard',
        description: 'Export standard des notes avec moyennes et commentaires',
        type: 'Notes',
        format: ['pdf', 'excel'],
        options_disponibles: ['moyennes', 'commentaires', 'statistiques']
      },
      {
        id: 'modele_bulletin_complet',
        nom: 'Bulletin complet',
        description: 'Bulletin de notes avec toutes les matières et statistiques',
        type: 'Bulletin',
        format: ['pdf'],
        options_disponibles: ['moyennes', 'rang', 'commentaires', 'statistiques', 'graphiques']
      },
      {
        id: 'modele_liste_eleves',
        nom: 'Liste des élèves',
        description: 'Liste complète des élèves avec moyennes et classement',
        type: 'Liste',
        format: ['pdf', 'excel', 'csv'],
        options_disponibles: ['moyennes', 'rang']
      }
    ];
  }

  private loadHistorique(): void {
    // Mock data
    this.historiqueExports = [
      {
        id: '1',
        nom: 'Notes_6emeA_Mathematiques_2024.pdf',
        statut: 'termine',
        progression: 100,
        url_telechargement: '/downloads/export1.pdf',
        date_creation: '2024-01-20T10:30:00Z',
        taille_fichier: '2.5 MB'
      },
      {
        id: '2',
        nom: 'Statistiques_ToulesClasses_2024.xlsx',
        statut: 'en_cours',
        progression: 65,
        date_creation: '2024-01-20T14:15:00Z'
      },
      {
        id: '3',
        nom: 'Bulletins_5emeB_T1.pdf',
        statut: 'erreur',
        progression: 0,
        date_creation: '2024-01-19T16:45:00Z'
      }
    ];
  }

  genererExport(): void {
    if (this.exportForm.invalid) {
      this.notificationService.error('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isExporting = true;
    const options: OptionsExport = this.exportForm.value;

    // Simulation de génération d'export
    this.notificationService.info('Export', 'Génération de l\'export en cours...');
    
    setTimeout(() => {
      this.isExporting = false;
      
      // Ajout à l'historique
      const nouvelExport: ExportJob = {
        id: Date.now().toString(),
        nom: this.genererNomFichier(options),
        statut: 'termine',
        progression: 100,
        url_telechargement: '/downloads/export_' + Date.now() + '.' + options.format,
        date_creation: new Date().toISOString(),
        taille_fichier: '1.8 MB'
      };
      
      this.historiqueExports.unshift(nouvelExport);
      this.activeTab = 'historique';
      
      this.notificationService.success('Export terminé', 'Votre fichier est prêt au téléchargement');
    }, 3000);
  }

  private genererNomFichier(options: OptionsExport): string {
    const classe = options.classe_id ? this.getClasseNom(options.classe_id) : 'ToutesClasses';
    const matiere = options.matiere_id ? this.getMatiereNom(options.matiere_id) : '';
    const date = new Date().toISOString().split('T')[0];
    
    return `${this.getTypeLabel(options.type)}_${classe}${matiere ? '_' + matiere : ''}_${date}.${options.format}`;
  }

  previsualiser(): void {
    this.notificationService.info('Prévisualisation', 'Génération de l\'aperçu...');
  }

  utiliserModele(modele: ModeleExport): void {
    // Pré-remplir le formulaire avec les options du modèle
    this.exportForm.patchValue({
      type: modele.type.toLowerCase(),
      format: modele.format[0]
    });
    
    this.activeTab = 'nouveau';
    this.notificationService.success('Modèle appliqué', `Le modèle "${modele.nom}" a été appliqué`);
  }

  previsualiserModele(modele: ModeleExport): void {
    this.notificationService.info('Prévisualisation', `Aperçu du modèle "${modele.nom}"`);
  }

  telechargerExport(exportJob: ExportJob): void {
    if (exportJob.url_telechargement) {
      // Simulation de téléchargement
      window.open(exportJob.url_telechargement, '_blank');
      this.notificationService.success('Téléchargement', 'Le fichier a été téléchargé');
    }
  }

  supprimerExport(exportJob: ExportJob): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${exportJob.nom}" ?`)) {
      this.historiqueExports = this.historiqueExports.filter(e => e.id !== exportJob.id);
      this.notificationService.success('Suppression', 'L\'export a été supprimé');
    }
  }

  // Helper methods
  getTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'notes': 'Notes',
      'bulletins': 'Bulletins',
      'liste_eleves': 'Liste élèves',
      'statistiques': 'Statistiques',
      'releve_notes': 'Relevé de notes'
    };
    return types[type] || type;
  }

  getFormatLabel(format: string): string {
    const formats: { [key: string]: string } = {
      'pdf': 'PDF',
      'excel': 'Excel',
      'csv': 'CSV'
    };
    return formats[format] || format;
  }

  getStatutLabel(statut: string): string {
    const statuts: { [key: string]: string } = {
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'erreur': 'Erreur'
    };
    return statuts[statut] || statut;
  }

  getClasseNom(classeId: number): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe ? classe.nom : '';
  }

  getMatiereNom(matiereId: number): string {
    const matiere = this.matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : '';
  }
}