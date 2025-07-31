import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { MatiereService } from '../../../../core/services/matiere.service';
import { UserService } from '../../../../core/services/user.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { 
  Matiere, 
  CreateMatiereRequest, 
  UpdateMatiereRequest 
} from '../../../../shared/models/matiere.model';
import { User } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-matiere-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './matiere-form.component.html',
  
})
export class MatiereFormComponent implements OnInit {
  matiereForm: FormGroup;
  isEditing = false;
  isLoading = false;
  error: string | null = null;
  matiereId: number | null = null;

  currentMatiere: Matiere | null = null;
  availableTeachers: User[] = [];
  enseignantsDisponibles: User[] = []; // ✅ Propriété ajoutée

  constructor(
    private fb: FormBuilder,
    private matiereService: MatiereService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.matiereForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [
        Validators.required, 
        Validators.maxLength(10),
        Validators.pattern(/^[A-Z0-9]+$/)
      ]],
      coefficient: ['', [
        Validators.required, 
        Validators.min(0.5), 
        Validators.max(5.0)
      ]],
      description: ['', Validators.maxLength(500)],
      actif: [true],
      selectedTeacher: ['']
    });

    // Auto-uppercase code field
    this.matiereForm.get('code')?.valueChanges.subscribe(value => {
      if (value) {
        this.matiereForm.get('code')?.setValue(value.toUpperCase(), { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.loadAvailableTeachers();
  }

  /**
   * Check if we're in edit mode
   */
  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.matiereId = +id;
      this.loadMatiere();
    }
  }

  /**
 * Vérifie si la matière a des enseignants affectés
 */
hasEnseignants(): boolean {
  return !!(this.currentMatiere?.enseignants && this.currentMatiere.enseignants.length > 0);
}

/**
 * Retourne la liste des enseignants de la matière (safe)
 */
getEnseignants(): User[] {
  return this.currentMatiere?.enseignants || [];
}

  /**
   * Load matiere data for editing
   */
  private loadMatiere(): void {
    if (!this.matiereId) return;

    this.isLoading = true;
    this.matiereService.getMatiereById(this.matiereId).subscribe({
      next: (matiere) => {
        this.currentMatiere = matiere;
        this.populateForm(matiere);
        this.loadEnseignantsDisponibles(); // ✅ Charger les enseignants disponibles
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la matière:', error);
        this.error = 'Impossible de charger les données de la matière';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load available teachers
   */
  private loadAvailableTeachers(): void {
  this.userService.getUsers({ role: 'enseignant', actif: true }).subscribe({
    next: (response) => {
      // ✅ Gestion sécurisée de la réponse
      let teachers: User[] = [];
      
      if (Array.isArray(response)) {
        teachers = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        teachers = (response as any).data || [];
      }
      
      this.availableTeachers = teachers.filter(teacher => 
        !this.currentMatiere?.enseignants?.some(assigned => assigned.id === teacher.id)
      );
    },
    error: (error) => {
      console.error('Erreur lors du chargement des enseignants:', error);
    }
  });
}

  /**
   * Load available teachers for this subject
   */
loadEnseignantsDisponibles(): void {
  if (!this.matiereId) return;

  this.matiereService.getEnseignantsDisponibles(this.matiereId).subscribe({
  next: (enseignants) => {
    this.enseignantsDisponibles = enseignants;
  },
  error: (error) => {
    console.error('Erreur lors du chargement des enseignants:', error);
    this.enseignantsDisponibles = [];
  }
});

}




  /**
   * Populate form with matiere data
   */
 private populateForm(matiere: Matiere): void {
  this.matiereForm.patchValue({
    nom: matiere.nom,
    code: matiere.code,
    coefficient: matiere.coefficient,
    description: matiere.description || '',
    actif: matiere.actif // ✅ Utiliser 'actif' au lieu de 'active'
  });
}

  /**
   * Get coefficient percentage for visual indicator
   */
  getCoefficientPercentage(): number {
    const coefficient = this.matiereForm.get('coefficient')?.value || 0;
    return Math.min(100, (coefficient / 5) * 100);
  }

  /**
   * Get coefficient level description
   */
  getCoefficientLevel(): string {
    const coefficient = this.matiereForm.get('coefficient')?.value || 0;
    if (coefficient <= 1) return 'Très faible';
    if (coefficient <= 2) return 'Faible';
    if (coefficient <= 3) return 'Moyen';
    if (coefficient <= 4) return 'Élevé';
    return 'Très élevé';
  }

  /**
   * Add teacher to matiere - ✅ Méthode ajoutée
   */
  addTeacher(): void {
  const selectedTeacherId = this.matiereForm.get('selectedTeacher')?.value;
  if (!selectedTeacherId || !this.matiereId) return;

  // ✅ Passer directement l'ID numérique, pas un objet
  this.matiereService.affecterEnseignant(this.matiereId, +selectedTeacherId).subscribe({
    next: () => {
      this.notificationService.success('Enseignant affecté', 'L\'enseignant a été affecté à la matière avec succès');
      // Réinitialiser le formulaire et recharger les données
      this.matiereForm.patchValue({ selectedTeacher: '' });
      this.loadEnseignantsDisponibles();
      this.loadMatiere();
    },
    error: (error) => {
      console.error('Erreur:', error);
      this.notificationService.error('Erreur', 'Impossible d\'affecter l\'enseignant');
    }
  });
}

  /**
   * Remove teacher from matiere
   */
  removeTeacher(teacherId: number): void {
    if (!this.matiereId) return;

    if (confirm('Êtes-vous sûr de vouloir retirer cet enseignant de la matière ?')) {
      this.matiereService.retirerEnseignant(this.matiereId, teacherId).subscribe({
        next: () => {
          this.notificationService.success('Enseignant retiré', 'L\'enseignant a été retiré de la matière avec succès');
          this.loadMatiere(); // Reload to get updated teacher list
          this.loadEnseignantsDisponibles();
        },
        error: (error) => {
          console.error('Erreur lors du retrait:', error);
          this.notificationService.error('Erreur', 'Impossible de retirer l\'enseignant de la matière');
        }
      });
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.matiereForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formData = { ...this.matiereForm.value };
    delete formData.selectedTeacher; // Remove helper field

    if (this.isEditing && this.matiereId) {
      this.updateMatiere(formData);
    } else {
      this.createMatiere(formData);
    }
  }

  /**
   * Create new matiere
   */
  private createMatiere(data: CreateMatiereRequest): void {
    this.matiereService.createMatiere(data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (matiere) => {
          this.notificationService.success('Matière créée', `La matière "${matiere.nom}" a été créée avec succès`);
          this.router.navigate(['/admin/matieres']);
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.handleFormError(error);
        }
      });
  }

  /**
   * Update existing matiere
   */
  private updateMatiere(data: UpdateMatiereRequest): void {
    if (!this.matiereId) return;

    this.matiereService.updateMatiere(this.matiereId, data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (matiere) => {
          this.notificationService.success('Matière modifiée', `La matière "${matiere.nom}" a été modifiée avec succès`);
          this.router.navigate(['/admin/matieres']);
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.handleFormError(error);
        }
      });
  }

  /**
   * Handle form errors
   */
  private handleFormError(error: any): void {
    if (error.status === 422 && error.error?.erreurs) {
      // Handle validation errors
      const errors = error.error.erreurs;
      Object.keys(errors).forEach(field => {
        const control = this.matiereForm.get(field);
        if (control) {
          control.setErrors({ server: errors[field][0] });
        }
      });
      this.error = 'Veuillez corriger les erreurs dans le formulaire';
    } else if (error.status === 409) {
      this.error = 'Une matière avec ce nom ou ce code existe déjà';
    } else {
      this.error = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.matiereForm.controls).forEach(key => {
      const control = this.matiereForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Navigate back to matiere list
   */
  goBack(): void {
    this.router.navigate(['/admin/matieres']);
  }
}