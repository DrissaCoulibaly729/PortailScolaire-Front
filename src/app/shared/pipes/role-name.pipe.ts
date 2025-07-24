import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../models/user.model';

@Pipe({
  name: 'roleName',
  standalone: true
})
export class RoleNamePipe implements PipeTransform {
  private roleNames: Record<UserRole, string> = {
    'administrateur': 'Administrateur',
    'enseignant': 'Enseignant',
    'eleve': 'Élève'
  };

  transform(role: UserRole): string {
    return this.roleNames[role] || role;
  }
}