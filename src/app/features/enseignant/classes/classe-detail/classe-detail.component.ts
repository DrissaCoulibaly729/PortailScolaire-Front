// src/app/features/enseignant/classes/classe-detail/classe-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '../../../../shared/models/auth.model';

// Interfaces temporaires
interface ClasseDetail {
  id: number;
  nom: string;
  niveau: string;
  section?: string;
  effectif: number;
  effectif_max: number;
  moyenne_generale: number;
  description?: string;
  enseignant_principal: string;
  matiere: string;
  annee_scolaire: string;
}

interface EleveClasse {
  id: number;
  nom: string;
  prenom: string;
  numero_etudiant: string;
  moyenne_generale?: number;
  nb_notes: number;
  derniere_note?: number;
  date_derniere_note?: string;
  absences: number;
  retards: number;
  rang?: number;
}

interface StatistiqueClasse {
  moyenne_classe: number;
  meilleure_moyenne: number;
  moyenne_la_plus_basse: number;
  mediane: number;
  ecart_type: number;
  nb_notes_total: number;
  repartition_mentions: { mention: string; nb: number; couleur: string }[];
}

@Component({
  selector: 'app-classe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Breadcrumb et Header -->
      <div class="mb-6">
        <nav class="flex" aria-label="Breadcrumb">
          <ol role="list" class="flex items-center space-x-4">
            <li>
              <div>
                <a routerLink="/enseignant/dashboard" class="text-gray-400 hover:text-gray-500">
                  <svg class="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </a>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <a routerLink="/enseignant/classes" class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Mes classes
                </a>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <span class="ml-4 text-sm font-medium text-gray-500">{{ classe?.nom }}</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <!-- Header de la classe -->
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8" *ngIf="classe">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ classe.nom }}</h1>
            <p class="text-gray-600 mt-2">{{ classe.niveau }} • {{ classe.matiere }} • {{ classe.annee_scolaire }}</p>
            <p class="text-sm text-gray-500 mt-1" *ngIf="classe.description">{{ classe.description }}</p>
          </div>
          
          <div class="flex space-x-3">
            <button (click)="ajouterNoteClasse()" 
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Saisir des notes
            </button>
            
            <button (click)="exporterClasse()" 
                    class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Exporter
            </button>
          </div>
        </div>

        <!-- Statistiques rapides de la classe -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{{ classe.effectif }}/{{ classe.effectif_max }}</p>
            <p class="text-sm text-gray-500">Effectif</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold"
               [ngClass]="{
                 'text-green-600': classe.moyenne_generale >= 16,
                 'text-blue-600': classe.moyenne_generale >= 14 && classe.moyenne_generale < 16,
                 'text-yellow-600': classe.moyenne_generale >= 12 && classe.moyenne_generale < 14,
                 'text-orange-600': classe.moyenne_generale >= 10 && classe.moyenne_generale < 12,
                 'text-red-600': classe.moyenne_generale < 10
               }">
              {{ classe.moyenne_generale | number:'1.2-2' }}
            </p>
            <p class="text-sm text-gray-500">Moyenne</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-purple-600">{{ statistiques?.nb_notes_total || 0 }}</p>
            <p class="text-sm text-gray-500">Notes saisies</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ statistiques?.ecart_type | number:'1.1-1' || 0 }}</p>
            <p class="text-sm text-gray-500">Écart-type</p>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="bg-white rounded-lg shadow-sm border mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex" aria-label="Tabs">
            <button (click)="activeTab = 'eleves'" 
                    [class]="activeTab === 'eleves' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
              Élèves ({{ eleves.length }})
            </button>
            <button (click)="activeTab = 'statistiques'" 
                    [class]="activeTab === 'statistiques' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
              Statistiques
            </button>
            <button (click)="activeTab = 'historique'" 
                    [class]="activeTab === 'historique' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
              Historique
            </button>
          </nav>
        </div>
      </div>

      <!-- Contenu des onglets -->
      
      <!-- Onglet Élèves -->
      <div *ngIf="activeTab === 'eleves'">
        <!-- Filtres élèves -->
        <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <input type="text" 
                     formControlName="recherche"
                     placeholder="Nom ou prénom..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select formControlName="tri" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="nom">Nom</option>
                <option value="moyenne">Moyenne</option>
                <option value="rang">Rang</option>
                <option value="nb_notes">Nombre de notes</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Affichage</label>
              <select formControlName="affichage" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="liste">Liste</option>
                <option value="grille">Grille</option>
              </select>
            </div>
            <div class="flex items-end">
              <button (click)="resetFilters()" 
                      class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        <!-- Liste des élèves -->
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Élève
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rang
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moyenne
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière note
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assiduité
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let eleve of elevesFiltres" class="hover:bg-gray-50">
                  <!-- Élève -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-700">
                          {{ eleve.nom.charAt(0) }}{{ eleve.prenom.charAt(0) }}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ eleve.nom }} {{ eleve.prenom }}
                        </div>
                        <div class="text-sm text-gray-500">{{ eleve.numero_etudiant }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Rang -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="{
                            'bg-yellow-100 text-yellow-800': eleve.rang === 1,
                            'bg-gray-100 text-gray-800': eleve.rang === 2,
                            'bg-orange-100 text-orange-800': eleve.rang === 3,
                            'bg-blue-100 text-blue-800': eleve.rang && eleve.rang > 3
                          }">
                      {{ eleve.rang ? '#' + eleve.rang : 'N/A' }}
                    </span>
                  </td>

                  <!-- Moyenne -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-bold"
                          [ngClass]="{
                            'text-green-600': eleve.moyenne_generale && eleve.moyenne_generale >= 16,
                            'text-blue-600': eleve.moyenne_generale && eleve.moyenne_generale >= 14 && eleve.moyenne_generale < 16,
                            'text-yellow-600': eleve.moyenne_generale && eleve.moyenne_generale >= 12 && eleve.moyenne_generale < 14,
                            'text-orange-600': eleve.moyenne_generale && eleve.moyenne_generale >= 10 && eleve.moyenne_generale < 12,
                            'text-red-600': eleve.moyenne_generale && eleve.moyenne_generale < 10,
                            'text-gray-400': !eleve.moyenne_generale
                          }">
                      {{ eleve.moyenne_generale ? (eleve.moyenne_generale | number:'1.2-2') + '/20' : 'N/A' }}
                    </span>
                  </td>

                  <!-- Nombre de notes -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ eleve.nb_notes }}
                  </td>

                  <!-- Dernière note -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div *ngIf="eleve.derniere_note && eleve.date_derniere_note">
                      <span class="font-medium">{{ eleve.derniere_note | number:'1.2-2' }}/20</span>
                      <div class="text-xs text-gray-400">{{ eleve.date_derniere_note | date:'dd/MM/yyyy' }}</div>
                    </div>
                    <span *ngIf="!eleve.derniere_note" class="text-gray-400">Aucune</span>
                  </td>

                  <!-- Assiduité -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex space-x-2">
                      <span class="text-red-600" *ngIf="eleve.absences > 0">{{ eleve.absences }} abs.</span>
                      <span class="text-orange-600" *ngIf="eleve.retards > 0">{{ eleve.retards }} ret.</span>
                      <span class="text-green-600" *ngIf="eleve.absences === 0 && eleve.retards === 0">Parfait</span>
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <button (click)="ajouterNoteEleve(eleve.id)" 
                              class="text-blue-600 hover:text-blue-900" 
                              title="Ajouter une note">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      </button>

                      <button (click)="voirNotesEleve(eleve.id)" 
                              class="text-green-600 hover:text-green-900" 
                              title="Voir les notes">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>

                      <button (click)="voirProfilEleve(eleve.id)" 
                              class="text-purple-600 hover:text-purple-900" 
                              title="Profil élève">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty state -->
                <tr *ngIf="elevesFiltres.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center">
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun élève trouvé</h3>
                    <p class="text-gray-500">Aucun élève ne correspond aux critères de recherche.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Onglet Statistiques -->
      <div *ngIf="activeTab === 'statistiques'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Répartition des mentions -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Répartition des mentions</h3>
          <div class="space-y-4" *ngIf="statistiques">
            <div *ngFor="let mention of statistiques.repartition_mentions" 
                 class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 rounded-full mr-3" [style.background-color]="mention.couleur"></div>
                <span class="text-sm font-medium text-gray-700">{{ mention.mention }}</span>
              </div>
              <span class="text-sm font-medium text-gray-900">{{ mention.nb }}</span>
            </div>
          </div>
        </div>

        <!-- Statistiques détaillées -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Statistiques détaillées</h3>
          <div class="space-y-4" *ngIf="statistiques">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Moyenne de classe</span>
              <span class="text-sm font-medium text-gray-900">{{ statistiques.moyenne_classe | number:'1.2-2' }}/20</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Meilleure moyenne</span>
              <span class="text-sm font-medium text-green-600">{{ statistiques.meilleure_moyenne | number:'1.2-2' }}/20</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Moyenne la plus basse</span>
              <span class="text-sm font-medium text-red-600">{{ statistiques.moyenne_la_plus_basse | number:'1.2-2' }}/20</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Médiane</span>
              <span class="text-sm font-medium text-gray-900">{{ statistiques.mediane | number:'1.2-2' }}/20</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Écart-type</span>
              <span class="text-sm font-medium text-gray-900">{{ statistiques.ecart_type | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Total notes saisies</span>
              <span class="text-sm font-medium text-gray-900">{{ statistiques.nb_notes_total }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglet Historique -->
      <div *ngIf="activeTab === 'historique'">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Historique des activités</h3>
          <div class="space-y-4">
            <div class="flex items-start space-x-3 py-3 border-b border-gray-100">
              <div class="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div class="flex-1">
                <p class="text-sm text-gray-900">Notes ajoutées pour l'évaluation de mathématiques</p>
                <p class="text-xs text-gray-500">Il y a 2 heures</p>
              </div>
            </div>
            <div class="flex items-start space-x-3 py-3 border-b border-gray-100">
              <div class="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div class="flex-1">
                <p class="text-sm text-gray-900">Note modifiée pour Pierre Dupont</p>
                <p class="text-xs text-gray-500">Hier à 14:30</p>
              </div>
            </div>
            <div class="flex items-start space-x-3 py-3">
              <div class="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
              <div class="flex-1">
                <p class="text-sm text-gray-900">Export de la liste de classe effectué</p>
                <p class="text-xs text-gray-500">Il y a 3 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClasseDetailComponent implements OnInit {
  classeId!: number;
  classe: ClasseDetail | null = null;
  eleves: EleveClasse[] = [];
  elevesFiltres: EleveClasse[] = [];
  statistiques: StatistiqueClasse | null = null;
  activeTab: 'eleves' | 'statistiques' | 'historique' = 'eleves';
  isLoading = false;

  // Filtres
  filterForm: FormGroup;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      recherche: [''],
      tri: ['nom'],
      affichage: ['liste']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classeId = +params['id'];
      this.loadClasseDetail();
      this.loadEleves();
      this.loadStatistiques();
    });

    this.initializeFilters();
  }

  private loadClasseDetail(): void {
    this.isLoading = true;
    
    // Mock data
    setTimeout(() => {
      this.classe = {
        id: this.classeId,
        nom: '6ème A',
        niveau: '6ème',
        section: 'A',
        effectif: 28,
        effectif_max: 30,
        moyenne_generale: 14.2,
        description: 'Classe de 6ème avec un bon niveau général',
        enseignant_principal: 'M. Dupont',
        matiere: 'Mathématiques',
        annee_scolaire: '2023-2024'
      };
      
      this.isLoading = false;
    }, 800);
  }

  private loadEleves(): void {
    // Mock data
    setTimeout(() => {
      this.eleves = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Pierre',
          numero_etudiant: 'ELE001',
          moyenne_generale: 16.5,
          nb_notes: 12,
          derniere_note: 18,
          date_derniere_note: '2024-01-20',
          absences: 0,
          retards: 1,
          rang: 1
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Sophie',
          numero_etudiant: 'ELE002',
          moyenne_generale: 15.2,
          nb_notes: 11,
          derniere_note: 14,
          date_derniere_note: '2024-01-18',
          absences: 2,
          retards: 0,
          rang: 2
        },
        {
          id: 3,
          nom: 'Durand',
          prenom: 'Lucas',
          numero_etudiant: 'ELE003',
          moyenne_generale: 12.8,
          nb_notes: 10,
          derniere_note: 15,
          date_derniere_note: '2024-01-15',
          absences: 1,
          retards: 3,
          rang: 5
        }
      ];

      this.elevesFiltres = [...this.eleves];
    }, 1000);
  }

  private loadStatistiques(): void {
    // Mock data
    setTimeout(() => {
      this.statistiques = {
        moyenne_classe: 14.2,
        meilleure_moyenne: 18.5,
        moyenne_la_plus_basse: 8.2,
        mediane: 14.0,
        ecart_type: 2.8,
        nb_notes_total: 324,
        repartition_mentions: [
          { mention: 'Très bien', nb: 5, couleur: '#10b981' },
          { mention: 'Bien', nb: 8, couleur: '#3b82f6' },
          { mention: 'Assez bien', nb: 12, couleur: '#f59e0b' },
          { mention: 'Passable', nb: 3, couleur: '#f97316' },
          { mention: 'Insuffisant', nb: 0, couleur: '#ef4444' }
        ]
      };
    }, 1200);
  }

  private initializeFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.appliquerFiltres();
    });
  }

  private appliquerFiltres(): void {
    const { recherche, tri } = this.filterForm.value;
    
    let resultats = [...this.eleves];

    // Filtre recherche
    if (recherche) {
      resultats = resultats.filter(eleve => 
        eleve.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        eleve.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
        eleve.numero_etudiant.toLowerCase().includes(recherche.toLowerCase())
      );
    }

    // Tri
    resultats.sort((a, b) => {
      switch (tri) {
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'moyenne':
          return (b.moyenne_generale || 0) - (a.moyenne_generale || 0);
        case 'rang':
          return (a.rang || 999) - (b.rang || 999);
        case 'nb_notes':
          return b.nb_notes - a.nb_notes;
        default:
          return 0;
      }
    });

    this.elevesFiltres = resultats;
  }

  resetFilters(): void {
    this.filterForm.reset({ recherche: '', tri: 'nom', affichage: 'liste' });
  }

  ajouterNoteClasse(): void {
    this.router.navigate(['/enseignant/notes/create'], { 
      queryParams: { classe_id: this.classeId } 
    });
  }

  ajouterNoteEleve(eleveId: number): void {
    this.router.navigate(['/enseignant/notes/create'], { 
      queryParams: { 
        classe_id: this.classeId,
        eleve_id: eleveId 
      } 
    });
  }

  voirNotesEleve(eleveId: number): void {
    this.router.navigate(['/enseignant/notes'], { 
      queryParams: { 
        classe_id: this.classeId,
        eleve_id: eleveId 
      } 
    });
  }

  voirProfilEleve(eleveId: number): void {
    this.notificationService.info('Profil élève', 'Fonctionnalité en cours de développement');
  }

  exporterClasse(): void {
    this.router.navigate(['/enseignant/export'], { 
      queryParams: { classe_id: this.classeId } 
    });
  }
}