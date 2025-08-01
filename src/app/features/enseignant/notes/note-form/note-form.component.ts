
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { EnseignantService } from '../../../../core/services/enseignant.service';
import { CreateNoteRequest } from '../../../../shared/models/note.model';
import { Classe } from '../../../../shared/models/classe.model';
import { Matiere } from '../../../../shared/models/matiere.model';
import { Eleve, User } from '../../../../shared/models/user.model';

// ✅ CORRECTION 1 : Définir les constantes directement dans le component
const TYPES_EVALUATION = [
  { value: 'devoir', label: 'Devoir' },
  { value: 'controle', label: 'Contrôle' },
  { value: 'examen', label: 'Examen' }
];

const PERIODES_TYPES = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' }
];

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Chargement des données...</span>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
              <p class="text-gray-600">{{ pageDescription }}</p>
            </div>
            <button (click)="router.navigate(['/enseignant/notes'])" 
                    class="text-gray-600 hover:text-gray-800 flex items-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Retour à la liste
            </button>
          </div>
        </div>

        <!-- Mode Selection (pour nouvelle note) -->
        <div *ngIf="!noteId" class="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Mode de saisie</h3>
          <div class="flex space-x-4">
            <button (click)="setMode('single')" 
                    [class]="mode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                    class="px-4 py-2 rounded-md font-medium transition-colors">
              Note individuelle
            </button>
            <button (click)="setMode('batch')" 
                    [class]="mode === 'batch' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                    class="px-4 py-2 rounded-md font-medium transition-colors">
              Saisie en lot
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Erreur</h3>
              <p class="text-sm text-red-700 mt-1">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Single Note Form -->
        <div *ngIf="mode === 'single'" class="bg-white rounded-lg shadow-sm border p-6">
          <form [formGroup]="noteForm" (ngSubmit)="onSubmitSingle()">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Matière -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Matière <span class="text-red-500">*</span>
                </label>
                <select formControlName="matiere_id" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez une matière</option>
                  <option *ngFor="let matiere of matieres" [value]="matiere.id">
                    {{ matiere.nom }} ({{ matiere.code }})
                  </option>
                </select>
                <div *ngIf="noteForm.get('matiere_id')?.errors?.['required'] && noteForm.get('matiere_id')?.touched" 
                     class="text-red-500 text-sm mt-1">La matière est obligatoire</div>
              </div>

              <!-- Classe -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Classe <span class="text-red-500">*</span>
                </label>
                <select formControlName="classe_id" (change)="onClasseChange()"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez une classe</option>
                  <option *ngFor="let classe of classes" [value]="classe.id">
                    {{ classe.nom }} - {{ classe.niveau }}
                  </option>
                </select>
                <div *ngIf="noteForm.get('classe_id')?.errors?.['required'] && noteForm.get('classe_id')?.touched" 
                     class="text-red-500 text-sm mt-1">La classe est obligatoire</div>
              </div>

              <!-- Élève -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Élève <span class="text-red-500">*</span>
                </label>
                <select formControlName="eleve_id" 
                        [disabled]="!noteForm.get('classe_id')?.value || isLoadingEleves"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                  <option value="">
                    {{ !noteForm.get('classe_id')?.value 
                        ? 'Sélectionnez d\'abord une classe' 
                        : isLoadingEleves 
                          ? 'Chargement des élèves...' 
                          : 'Sélectionnez un élève' }}
                  </option>
                  <option *ngFor="let eleve of eleves" [value]="eleve.id">
                    {{ eleve.nom }} {{ eleve.prenom }}
                    <span *ngIf="eleve.numero_etudiant">({{ eleve.numero_etudiant }})</span>
                  </option>
                </select>
                <div *ngIf="noteForm.get('eleve_id')?.errors?.['required'] && noteForm.get('eleve_id')?.touched" 
                     class="text-red-500 text-sm mt-1">L'élève est obligatoire</div>
              </div>

              <!-- Note -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Note sur 20 <span class="text-red-500">*</span>
                </label>
                <input type="number" 
                       formControlName="valeur" 
                       min="0" 
                       max="20" 
                       step="0.25"
                       placeholder="Ex: 15.5"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div *ngIf="noteForm.get('valeur')?.errors && noteForm.get('valeur')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  <span *ngIf="noteForm.get('valeur')?.errors?.['required']">La note est obligatoire</span>
                  <span *ngIf="noteForm.get('valeur')?.errors?.['min']">La note doit être supérieure ou égale à 0</span>
                  <span *ngIf="noteForm.get('valeur')?.errors?.['max']">La note doit être inférieure ou égale à 20</span>
                </div>
              </div>

              <!-- Type d'évaluation -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Type d'évaluation <span class="text-red-500">*</span>
                </label>
                <select formControlName="type" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez un type</option>
                  <option *ngFor="let type of typesEvaluation" [value]="type.value">
                    {{ type.label }}
                  </option>
                </select>
                <div *ngIf="noteForm.get('type')?.errors?.['required'] && noteForm.get('type')?.touched" 
                     class="text-red-500 text-sm mt-1">Le type d'évaluation est obligatoire</div>
              </div>

              <!-- Période -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Période <span class="text-red-500">*</span>
                </label>
                <select formControlName="periode" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez une période</option>
                  <option *ngFor="let periode of periodes" [value]="periode.value">
                    {{ periode.label }}
                  </option>
                </select>
                <div *ngIf="noteForm.get('periode')?.errors?.['required'] && noteForm.get('periode')?.touched" 
                     class="text-red-500 text-sm mt-1">La période est obligatoire</div>
              </div>

              <!-- Date d'évaluation -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date d'évaluation <span class="text-red-500">*</span>
                </label>
                <input type="date" 
                       formControlName="date_evaluation" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div *ngIf="noteForm.get('date_evaluation')?.errors?.['required'] && noteForm.get('date_evaluation')?.touched" 
                     class="text-red-500 text-sm mt-1">La date d'évaluation est obligatoire</div>
              </div>

              <!-- Coefficient -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Coefficient <span class="text-red-500">*</span>
                </label>
                <input type="number" 
                       formControlName="coefficient" 
                       min="0.5" 
                       max="5" 
                       step="0.5"
                       placeholder="1"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <div *ngIf="noteForm.get('coefficient')?.errors && noteForm.get('coefficient')?.touched" 
                     class="text-red-500 text-sm mt-1">
                  <span *ngIf="noteForm.get('coefficient')?.errors?.['required']">Le coefficient est obligatoire</span>
                  <span *ngIf="noteForm.get('coefficient')?.errors?.['min']">Le coefficient doit être au minimum 0.5</span>
                  <span *ngIf="noteForm.get('coefficient')?.errors?.['max']">Le coefficient doit être au maximum 5</span>
                </div>
              </div>
            </div>

            <!-- Commentaire -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
              <textarea formControlName="commentaire" 
                        rows="3" 
                        placeholder="Commentaire optionnel sur la note..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <!-- Actions -->
            <div class="mt-8 flex justify-end space-x-4">
              <button type="button" 
                      (click)="router.navigate(['/enseignant/notes'])"
                      class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" 
                      [disabled]="!noteForm.valid || isSubmitting"
                      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isEdit ? 'Mettre à jour' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Batch Notes Form -->
        <div *ngIf="mode === 'batch'" class="bg-white rounded-lg shadow-sm border p-6">
          <form [formGroup]="batchForm" (ngSubmit)="onSubmitBatch()">
            <!-- Configuration commune -->
            <div class="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 class="text-lg font-medium text-blue-900 mb-4">Configuration commune</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Matière -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Matière <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="matiere_id" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionnez une matière</option>
                    <option *ngFor="let matiere of matieres" [value]="matiere.id">
                      {{ matiere.nom }}
                    </option>
                  </select>
                </div>

                <!-- Classe -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Classe <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="classe_id" (change)="onBatchClasseChange()"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionnez une classe</option>
                    <option *ngFor="let classe of classes" [value]="classe.id">
                      {{ classe.nom }}
                    </option>
                  </select>
                </div>

                <!-- Type d'évaluation -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Type <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="type" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionnez un type</option>
                    <option *ngFor="let type of typesEvaluation" [value]="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>

                <!-- Période -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Période <span class="text-red-500">*</span>
                  </label>
                  <select formControlName="periode" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionnez une période</option>
                    <option *ngFor="let periode of periodes" [value]="periode.value">
                      {{ periode.label }}
                    </option>
                  </select>
                </div>

                <!-- Date d'évaluation -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Date <span class="text-red-500">*</span>
                  </label>
                  <input type="date" 
                         formControlName="date_evaluation" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Coefficient -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Coefficient <span class="text-red-500">*</span>
                  </label>
                  <input type="number" 
                         formControlName="coefficient" 
                         min="0.5" 
                         max="5" 
                         step="0.5"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Liste des élèves avec notes -->
            <div *ngIf="batchForm.get('classe_id')?.value && eleves.length > 0" class="mb-6">
              <h4 class="text-lg font-medium text-gray-900 mb-4">Notes des élèves</h4>
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div class="grid grid-cols-12 gap-4 font-medium text-sm text-gray-700">
                    <div class="col-span-1">#</div>
                    <div class="col-span-4">Élève</div>
                    <div class="col-span-2">Note/20</div>
                    <div class="col-span-5">Commentaire</div>
                  </div>
                </div>
                <div formArrayName="notes" class="divide-y divide-gray-200">
                  <div *ngFor="let noteControl of getNotesControls(); let i = index" 
                       [formGroupName]="i" 
                       class="px-4 py-3 hover:bg-gray-50">
                    <div class="grid grid-cols-12 gap-4 items-center">
                      <div class="col-span-1">
                        <span class="text-sm text-gray-500">{{ i + 1 }}</span>
                      </div>
                      <div class="col-span-4">
                        <div class="flex items-center">
                          <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span class="text-xs font-medium text-blue-800">
                              {{ getEleveFromControl(noteControl)?.nom?.charAt(0) }}{{ getEleveFromControl(noteControl)?.prenom?.charAt(0) }}
                            </span>
                          </div>
                          <div>
                            <p class="text-sm font-medium text-gray-900">
                              {{ getEleveFromControl(noteControl)?.nom }} {{ getEleveFromControl(noteControl)?.prenom }}
                            </p>
                            <p class="text-xs text-gray-500">{{ getEleveFromControl(noteControl)?.numero_etudiant }}</p>
                          </div>
                        </div>
                      </div>
                      <div class="col-span-2">
                        <input type="number" 
                               formControlName="valeur" 
                               min="0" 
                               max="20" 
                               step="0.25"
                               placeholder="Note"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center">
                      </div>
                      <div class="col-span-5">
                        <input type="text" 
                               formControlName="commentaire" 
                               placeholder="Commentaire optionnel"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No students message -->
            <div *ngIf="batchForm.get('classe_id')?.value && eleves.length === 0 && !isLoadingEleves" 
                 class="text-center py-8 text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              <p>Aucun élève trouvé dans cette classe.</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-4">
              <button type="button" 
                      (click)="router.navigate(['/enseignant/notes'])"
                      class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" 
                      [disabled]="!batchForm.valid || isSubmitting || !hasValidNotes()"
                      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrer les notes ({{ getValidNotesCount() }})
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class NoteFormComponent implements OnInit, OnDestroy {
  // Forms
  noteForm!: FormGroup;
  batchForm!: FormGroup;
  
  // Data
  currentUser: User | null = null;
  classes: Classe[] = [];
  matieres: Matiere[] = [];
  eleves: Eleve[] = [];
  
  // State
  mode: 'single' | 'batch' = 'single';
  isEdit = false;
  noteId: number | null = null;
  isSubmitting = false;
  isLoading = true;
  isLoadingEleves = false;
  errorMessage = '';
  
  // ✅ CORRECTION 2 : Constantes définies localement
  typesEvaluation = TYPES_EVALUATION;
  periodes = PERIODES_TYPES;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private enseignantService: EnseignantService,
    public router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.checkRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageTitle(): string {
    if (this.isEdit) return 'Modifier la note';
    if (this.mode === 'batch') return 'Saisie en lot';
    return 'Nouvelle note';
  }

  get pageDescription(): string {
    if (this.isEdit) return 'Modifiez les informations de la note';
    if (this.mode === 'batch') return 'Saisissez plusieurs notes en une seule fois';
    return 'Ajoutez une nouvelle note pour un élève';
  }

  private initializeForms(): void {
    // Single note form
    this.noteForm = this.fb.group({
      eleve_id: ['', Validators.required],
      matiere_id: ['', Validators.required],
      classe_id: ['', Validators.required],
      valeur: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      type: ['', Validators.required],
      periode: ['', Validators.required],
      date_evaluation: [this.formatDate(new Date()), Validators.required],
      coefficient: [1, [Validators.required, Validators.min(0.5), Validators.max(5)]],
      commentaire: ['']
    });

    // Batch form
    this.batchForm = this.fb.group({
      matiere_id: ['', Validators.required],
      classe_id: ['', Validators.required],
      type: ['', Validators.required],
      periode: ['', Validators.required],
      date_evaluation: [this.formatDate(new Date()), Validators.required],
      coefficient: [1, [Validators.required, Validators.min(0.5), Validators.max(5)]],
      notes: this.fb.array([])
    });
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user as User;
        if (user?.id) {
          this.loadInitialData();
        }
      });
  }

  // ✅ CORRECTION 3 : Forcer le chargement des données
  private loadInitialData(): void {
    if (!this.currentUser?.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Charger les classes et matières en forçant le refresh
    const loadClasses$ = this.enseignantService.getClasses(this.currentUser.id, true);
    const loadMatieres$ = this.enseignantService.getMatieres(this.currentUser.id, true);

    // Charger en parallèle
    Promise.all([
      loadClasses$.toPromise(),
      loadMatieres$.toPromise()
    ]).then(([classes, matieres]) => {
      this.classes = classes || [];
      this.matieres = matieres || [];
      this.isLoading = false;
      
      // Pré-remplir les formulaires si des paramètres sont passés
      this.fillFormFromQueryParams();
    }).catch(error => {
      console.error('Erreur lors du chargement des données:', error);
      this.errorMessage = 'Impossible de charger les données nécessaires. Veuillez réessayer.';
      this.isLoading = false;
    });
  }

  // ✅ CORRECTION 4 : Pré-remplir depuis les query params
  private fillFormFromQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['classe_id']) {
        this.noteForm.patchValue({ classe_id: +params['classe_id'] });
        this.batchForm.patchValue({ classe_id: +params['classe_id'] });
        this.loadEleves(+params['classe_id']);
      }
      if (params['matiere_id']) {
        this.noteForm.patchValue({ matiere_id: +params['matiere_id'] });
        this.batchForm.patchValue({ matiere_id: +params['matiere_id'] });
      }
      if (params['eleve_id']) {
        this.noteForm.patchValue({ eleve_id: +params['eleve_id'] });
      }
    });
  }

  private checkRouteParams(): void {
    // Vérifier les paramètres de route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.noteId = +params['id'];
        this.isEdit = true;
        this.mode = 'single';
        // TODO: Implémenter loadNoteForEdit quand l'API sera prête
      }
    });

    // Vérifier les données de route pour le mode batch
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['mode'] === 'batch') {
        this.mode = 'batch';
      }
    });
  }

  setMode(mode: 'single' | 'batch'): void {
    this.mode = mode;
    if (mode === 'batch') {
      this.router.navigate(['/enseignant/notes/batch']);
    }
  }

  onClasseChange(): void {
    const classeId = this.noteForm.get('classe_id')?.value;
    if (classeId) {
      this.loadEleves(+classeId);
    }
    this.noteForm.get('eleve_id')?.setValue('');
  }

  onBatchClasseChange(): void {
    const classeId = this.batchForm.get('classe_id')?.value;
    if (classeId) {
      this.loadEleves(+classeId);
      // Les notes seront configurées après le chargement des élèves
    }
  }

  // ✅ CORRECTION 5 : Améliorer le chargement des élèves
  private loadEleves(classeId: number): void {
    this.isLoadingEleves = true;
    this.eleves = [];
    
    this.enseignantService.getElevesClasse(classeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eleves) => {
          this.eleves = eleves || [];
          this.isLoadingEleves = false;
          
          // Pour le mode batch, configurer les contrôles des notes
          if (this.mode === 'batch' && this.eleves.length > 0) {
            this.setupBatchNotes();
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des élèves:', error);
          this.errorMessage = 'Impossible de charger la liste des élèves de cette classe.';
          this.eleves = [];
          this.isLoadingEleves = false;
        }
      });
  }

  private setupBatchNotes(): void {
    const notesArray = this.batchForm.get('notes') as FormArray;
    notesArray.clear();

    this.eleves.forEach(eleve => {
      const noteGroup = this.fb.group({
        eleve_id: [eleve.id],
        valeur: ['', [Validators.min(0), Validators.max(20)]],
        commentaire: ['']
      });
      notesArray.push(noteGroup);
    });
  }

  getNotesControls(): AbstractControl[] {
    const notesArray = this.batchForm.get('notes') as FormArray;
    return notesArray.controls;
  }

  getEleveFromControl(control: AbstractControl): Eleve | undefined {
    const eleveId = control.get('eleve_id')?.value;
    return this.eleves.find(eleve => eleve.id === eleveId);
  }

  hasValidNotes(): boolean {
    const notesArray = this.batchForm.get('notes') as FormArray;
    return notesArray.controls.some(control => {
      const valeur = control.get('valeur')?.value;
      return valeur !== null && valeur !== undefined && valeur !== '';
    });
  }

  getValidNotesCount(): number {
    const notesArray = this.batchForm.get('notes') as FormArray;
    return notesArray.controls.filter(control => {
      const valeur = control.get('valeur')?.value;
      return valeur !== null && valeur !== undefined && valeur !== '';
    }).length;
  }

  // ✅ CORRECTION 6 : Améliorer la soumission simple
  onSubmitSingle(): void {
    if (!this.noteForm.valid || !this.currentUser?.id) {
      this.markFormGroupTouched(this.noteForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    
    const noteData: CreateNoteRequest = {
      eleve_id: +this.noteForm.value.eleve_id,
      matiere_id: +this.noteForm.value.matiere_id,
      classe_id: +this.noteForm.value.classe_id,
      valeur: +this.noteForm.value.valeur,
      type: this.noteForm.value.type,
      periode: this.noteForm.value.periode,
      date_evaluation: this.noteForm.value.date_evaluation,
      coefficient: +this.noteForm.value.coefficient,
      commentaire: this.noteForm.value.commentaire || undefined
    };

    const request$ = this.isEdit && this.noteId
      ? this.enseignantService.updateNote(this.noteId, noteData)
      : this.enseignantService.createNote(noteData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.router.navigate(['/enseignant/notes'], {
          queryParams: { success: this.isEdit ? 'updated' : 'created' }
        });
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.errorMessage = `Erreur lors de l'${this.isEdit ? 'mise à jour' : 'enregistrement'} de la note. Veuillez réessayer.`;
        this.isSubmitting = false;
      }
    });
  }

  // ✅ CORRECTION 7 : Améliorer la soumission batch
  onSubmitBatch(): void {
    if (!this.batchForm.valid || !this.currentUser?.id) {
      this.markFormGroupTouched(this.batchForm);
      return;
    }

    if (!this.hasValidNotes()) {
      this.errorMessage = 'Veuillez saisir au moins une note.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    
    const commonData = {
      matiere_id: +this.batchForm.value.matiere_id,
      classe_id: +this.batchForm.value.classe_id,
      type: this.batchForm.value.type,
      periode: this.batchForm.value.periode,
      date_evaluation: this.batchForm.value.date_evaluation,
      coefficient: +this.batchForm.value.coefficient
    };

    const notesArray = this.batchForm.get('notes') as FormArray;
    const validNotes: CreateNoteRequest[] = [];

    notesArray.controls.forEach(control => {
      const valeur = control.get('valeur')?.value;
      if (valeur !== null && valeur !== undefined && valeur !== '') {
        validNotes.push({
          ...commonData,
          eleve_id: +control.get('eleve_id')?.value,
          valeur: +valeur,
          commentaire: control.get('commentaire')?.value || undefined
        });
      }
    });

    this.enseignantService.createNotesEnLot(validNotes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.router.navigate(['/enseignant/notes'], {
            queryParams: { 
              success: 'batch_created',
              count: validNotes.length 
            }
          });
        },
        error: (error) => {
          console.error('Erreur lors de l\'enregistrement en lot:', error);
          this.errorMessage = 'Erreur lors de l\'enregistrement des notes. Veuillez réessayer.';
          this.isSubmitting = false;
        }
      });
  }

  // ✅ CORRECTION 8 : Utilitaires
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}