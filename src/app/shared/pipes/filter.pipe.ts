// src/app/shared/pipes/filter.pipe.ts (NOUVEAU)
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true,
  pure: false // Nécessaire pour que le pipe se réévalue
})
export class FilterPipe implements PipeTransform {
  
  /**
   * Filtre un tableau d'objets selon une propriété et une valeur
   * @param items - Le tableau à filtrer
   * @param property - La propriété à vérifier
   * @param value - La valeur recherchée
   * @returns Le tableau filtré
   */
  transform<T>(items: T[], property: keyof T, value: any): T[] {
    if (!items || !property) {
      return items;
    }

    if (value === null || value === undefined || value === '') {
      return items;
    }

    return items.filter(item => {
      const itemValue = item[property];
      
      // Comparaison exacte pour les valeurs primitives
      if (typeof itemValue === 'string' || typeof itemValue === 'number' || typeof itemValue === 'boolean') {
        return itemValue === value;
      }
      
      // Pour les autres types, convertir en string et comparer
      return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
    });
  }
}

// Exemple d'utilisation dans le template :
// {{ items | filter:'property':'value' }}
// {{ bulletins | filter:'statut':'publie' }}