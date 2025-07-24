import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ===== Validateurs Personnalisés =====

// src/app/shared/validators/custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  /**
   * Validateur pour les mots de passe forts
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      
      const valid = hasMinLength && hasUpperCase && hasLowerCase && hasNumeric;
      
      if (!valid) {
        return {
          strongPassword: {
            hasMinLength,
            hasUpperCase,
            hasLowerCase,
            hasNumeric,
            hasSpecialChar
          }
        };
      }
      
      return null;
    };
  }

  /**
   * Validateur pour les emails académiques
   */
  static academicEmail(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const academicPattern = /\.(edu|ac\.|univ-|ecole\.|college\.)|\b(edu|academic|school|college|university)\b/i;
      
      if (!emailPattern.test(value)) {
        return { email: true };
      }
      
      if (!academicPattern.test(value) && !value.includes('ecole.fr')) {
        return { academicEmail: true };
      }
      
      return null;
    };
  }

  /**
   * Validateur pour les notes (0-20)
   */
  static gradeRange(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = parseFloat(control.value);
      if (isNaN(value)) return null;
      
      if (value < 0 || value > 20) {
        return { gradeRange: { min: 0, max: 20, actual: value } };
      }
      
      return null;
    };
  }

  /**
   * Validateur pour la date de naissance (âge raisonnable)
   */
  static ageRange(minAge: number = 3, maxAge: number = 100): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < minAge || age > maxAge) {
        return { ageRange: { minAge, maxAge, actualAge: age } };
      }
      
      return null;
    };
  }

  /**
   * Validateur pour les codes matière (format spécifique)
   */
  static subjectCode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const pattern = /^[A-Z]{2,6}$/;
      if (!pattern.test(value)) {
        return { subjectCode: true };
      }
      
      return null;
    };
  }

  /**
   * Validateur pour vérifier que deux champs correspondent
   */
  static matchFields(fieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const field = control.parent?.get(fieldName);
      if (!field || !control.value || !field.value) return null;
      
      if (control.value !== field.value) {
        return { matchFields: { fieldName } };
      }
      
      return null;
    };
  }
}
