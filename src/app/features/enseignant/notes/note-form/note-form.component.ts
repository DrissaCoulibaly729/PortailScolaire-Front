import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { NoteService } from '../../../../core/services/note.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { 
  Note,
  CreateNoteRequest,
  TYPES_EVALUATION,
  TypeEvaluation,
  isNoteValide 
} from '../../../../shared/models/notes-bulletins.model';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Saisie des notes</h1>
            <p class="text-gray-600 mt-2">Ajoutez des notes pour vos élèves</p>
          </div>
          <button (click)="goBack()" 
                  class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Retour
          </button>
        </div>
      </div>

      <div class="max-w-4xl mx-auto">
        <!-- Mode Selection -->
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Mode de saisie</h3>
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
                    {{ matiere.nom }}
                  </option>
                </select>
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
                    {{ classe.nom }}
                  </option>
                </select>
              </div>

              <!-- Élève -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Élève <span class="text-red-500">*</span>
                </label>
                <select formControlName="eleve_id" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez un élève</option>
                  <option *ngFor="let eleve of eleves" [value]="eleve.id">
                    {{ eleve.nom }} {{ eleve.prenom }}
                  </option>
                </select>
              </div>

              <!-- Type d'évaluation -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Type d'évaluation <span class="text-red-500">*</span>
                </label>
                <select formControlName="type_evaluation" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez un type</option>
                  <option *ngFor="let type of typesEvaluation" [value]="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>

              <!-- Note -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Note <span class="text-red-500">*</span>
                </label>
                <input type="number" 
                       formControlName="valeur"
                       min="0" max="20" step="0.25"
                       placeholder="Note sur 20"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <!-- Coefficient -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Coefficient
                </label>
                <input type="number" 
                       formControlName="coefficient"
                       min="0.5" max="5" step="0.5"
                       placeholder="1.0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date d'évaluation <span class="text-red-500">*</span>
                </label>
                <input type="date" 
                       formControlName="date_evaluation"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Commentaire -->
            <div class="mt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Commentaire
              </label>
              <textarea formControlName="commentaire"
                        rows="3"
                        placeholder="Commentaire optionnel sur cette note..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
            </div>

            <!-- Submit -->
            <div class="mt-6 flex justify-end">
              <button type="submit" 
                      [disabled]="noteForm.invalid || isLoading"
                      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <div *ngIf="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer la note' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Batch Notes Form -->
        <div *ngIf="mode === 'batch'" class="bg-white rounded-lg shadow-sm border p-6">
          <form [formGroup]="batchForm" (ngSubmit)="onSubmitBatch()">
            <!-- Common fields -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Type d'évaluation <span class="text-red-500">*</span>
                </label>
                <select formControlName="type_evaluation" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionnez un type</option>
                  <option *ngFor="let type of typesEvaluation" [value]="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Date and coefficient -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date d'évaluation <span class="text-red-500">*</span>
                </label>
                <input type="date" 
                       formControlName="date_evaluation"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Coefficient
                </label>
                <input type="number" 
                       formControlName="coefficient"
                       min="0.5" max="5" step="0.5"
                       placeholder="1.0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Students grid -->
            <div *ngIf="elevesBatch.length > 0">
              <h4 class="text-lg font-medium text-gray-900 mb-4">Notes des élèves</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Élève
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note /20
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commentaire
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let eleve of elevesBatch; let i = index">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                          {{ eleve.nom }} {{ eleve.prenom }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ eleve.numero_etudiant }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input type="number" 
                               [value]="eleve.note || ''"
                               (input)="updateEleveNote(i, $event)"
                               min="0" max="20" step="0.25"
                               placeholder="Note"
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </td>
                      <td class="px-6 py-4">
                        <input type="text" 
                               [value]="eleve.commentaire || ''"
                               (input)="updateEleveComment(i, $event)"
                               placeholder="Commentaire optionnel"
                               class="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Submit -->
            <div class="mt-6 flex justify-end">
              <button type="submit" 
                      [disabled]="batchForm.invalid || isLoading || !hasValidNotes()"
                      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <div *ngIf="isLoading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer les notes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class NoteFormComponent implements OnInit {
  mode: 'single' | 'batch' = 'single';
  noteForm: FormGroup;
  batchForm: FormGroup;
  isLoading = false;

  // Data
  matieres: any[] = [];
  classes: any[] = [];
  eleves: any[] = [];
  elevesBatch: any[] = [];
  typesEvaluation = TYPES_EVALUATION;

  constructor(
    private fb: FormBuilder,
    private noteService: NoteService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.noteForm = this.fb.group({
      matiere_id: ['', Validators.required],
      classe_id: ['', Validators.required],
      eleve_id: ['', Validators.required],
      type_evaluation: ['', Validators.required],
      valeur: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      coefficient: [1],
      date_evaluation: [new Date().toISOString().split('T')[0], Validators.required],
      commentaire: ['']
    });

    this.batchForm = this.fb.group({
      matiere_id: ['', Validators.required],
      classe_id: ['', Validators.required],
      type_evaluation: ['', Validators.required],
      date_evaluation: [new Date().toISOString().split('T')[0], Validators.required],
      coefficient: [1]
    });
  }

  ngOnInit(): void {
    this.loadFormData();
  }

  private loadFormData(): void {
    // Mock data
    this.matieres = [
      { id: 1, nom: 'Mathématiques', coefficient: 4 },
      { id: 2, nom: 'Français', coefficient: 3 },
      { id: 3, nom: 'Physique', coefficient: 3 }
    ];

    this.classes = [
      { id: 1, nom: '6ème A' },
      { id: 2, nom: '5ème B' },
      { id: 3, nom: 'Terminale C' }
    ];
  }

  setMode(mode: 'single' | 'batch'): void {
    this.mode = mode;
  }

  onClasseChange(): void {
    const classeId = this.noteForm.get('classe_id')?.value;
    if (classeId) {
      // Mock students for the class
      this.eleves = [
        { id: 1, nom: 'Dupont', prenom: 'Pierre', numero_etudiant: 'ELE001' },
        { id: 2, nom: 'Martin', prenom: 'Sophie', numero_etudiant: 'ELE002' },
        { id: 3, nom: 'Durand', prenom: 'Lucas', numero_etudiant: 'ELE003' }
      ];
    }
  }

  onBatchClasseChange(): void {
    const classeId = this.batchForm.get('classe_id')?.value;
    if (classeId) {
      this.elevesBatch = [
        { id: 1, nom: 'Dupont', prenom: 'Pierre', numero_etudiant: 'ELE001', note: null, commentaire: '' },
        { id: 2, nom: 'Martin', prenom: 'Sophie', numero_etudiant: 'ELE002', note: null, commentaire: '' },
        { id: 3, nom: 'Durand', prenom: 'Lucas', numero_etudiant: 'ELE003', note: null, commentaire: '' }
      ];
    }
  }

  updateEleveNote(index: number, event: any): void {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && isNoteValide(value)) {
      this.elevesBatch[index].note = value;
    } else if (event.target.value === '') {
      this.elevesBatch[index].note = null;
    }
  }

  updateEleveComment(index: number, event: any): void {
    this.elevesBatch[index].commentaire = event.target.value;
  }

  hasValidNotes(): boolean {
    return this.elevesBatch.some(eleve => eleve.note !== null && eleve.note !== undefined);
  }

  onSubmitSingle(): void {
    if (this.noteForm.invalid) return;

    this.isLoading = true;
    const noteData: CreateNoteRequest = this.noteForm.value;

    this.noteService.createNote(noteData).subscribe({
      next: () => {
        this.notificationService.success('Note enregistrée', 'La note a été ajoutée avec succès');
        this.noteForm.reset();
        this.router.navigate(['/enseignant/notes']);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.error('Erreur', 'Impossible d\'enregistrer la note');
        this.isLoading = false;
      }
    });
  }

  onSubmitBatch(): void {
    if (this.batchForm.invalid || !this.hasValidNotes()) return;

    this.isLoading = true;
    const baseData = this.batchForm.value;
    
    const notes: CreateNoteRequest[] = this.elevesBatch
      .filter(eleve => eleve.note !== null && eleve.note !== undefined)
      .map(eleve => ({
        ...baseData,
        eleve_id: eleve.id,
        valeur: eleve.note,
        commentaire: eleve.commentaire || undefined
      }));

    this.noteService.createNotesEnLot(notes).subscribe({
      next: () => {
        this.notificationService.success('Notes enregistrées', `${notes.length} notes ont été ajoutées avec succès`);
        this.batchForm.reset();
        this.elevesBatch = [];
        this.router.navigate(['/enseignant/notes']);
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.notificationService.error('Erreur', 'Impossible d\'enregistrer les notes');
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/enseignant/notes']);
  }
}