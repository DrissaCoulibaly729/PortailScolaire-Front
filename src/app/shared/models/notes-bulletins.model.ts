export * from './note.model';
export * from './bulletin.model';


// Types spécifiques pour les notes et bulletins
export type TypeEvaluation = 'devoir' | 'controle' | 'examen';
export type Periode = 'trimestre1' | 'trimestre2' | 'trimestre3';
export type TypePeriode = 'trimestre' | 'semestre' | 'annuel';

// Constantes pour les types d'évaluation
export const TYPES_EVALUATION: Array<{value: TypeEvaluation, label: string, color: string}> = [
  { value: 'devoir', label: 'Devoir', color: 'blue' },
  { value: 'controle', label: 'Contrôle', color: 'orange' },
  { value: 'examen', label: 'Examen', color: 'red' }
];

// Constantes pour les périodes
export const PERIODES_TYPES: Array<{value: Periode, label: string}> = [
  { value: 'trimestre1', label: '1er Trimestre' },
  { value: 'trimestre2', label: '2ème Trimestre' },
  { value: 'trimestre3', label: '3ème Trimestre' }
];

// Constantes pour les mentions (déjà définies dans bulletin.model.ts)
export const MENTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'green', seuil_min: 18 },
  { value: 'tres_bien', label: 'Très Bien', color: 'blue', seuil_min: 16 },
  { value: 'bien', label: 'Bien', color: 'indigo', seuil_min: 14 },
  { value: 'assez_bien', label: 'Assez Bien', color: 'yellow', seuil_min: 12 },
  { value: 'passable', label: 'Passable', color: 'orange', seuil_min: 10 },
  { value: 'insuffisant', label: 'Insuffisant', color: 'red', seuil_min: 0 }
] as const;

// Constantes pour les statuts de bulletin
export const STATUTS_BULLETIN = [
  { value: 'brouillon', label: 'Brouillon', color: 'gray' },
  { value: 'valide', label: 'Validé', color: 'green' },
  { value: 'envoye', label: 'Envoyé', color: 'blue' },
  { value: 'archive', label: 'Archivé', color: 'purple' }
] as const;

// ===== Fonctions utilitaires =====

/**
 * Obtenir le label d'un type d'évaluation
 */
export function getTypeEvaluationLabel(type: TypeEvaluation): string {
  const typeObj = TYPES_EVALUATION.find(t => t.value === type);
  return typeObj?.label || type;
}

/**
 * Obtenir la couleur d'un type d'évaluation
 */
export function getTypeEvaluationColor(type: TypeEvaluation): string {
  const typeObj = TYPES_EVALUATION.find(t => t.value === type);
  return typeObj?.color || 'gray';
}

/**
 * Obtenir la mention à partir d'une note
 */
export function getMentionFromNote(note: number): string {
  for (const mention of MENTIONS) {
    if (note >= mention.seuil_min) {
      return mention.value;
    }
  }
  return 'insuffisant';
}

/**
 * Obtenir le label d'une mention
 */
export function getMentionLabel(mention: string): string {
  const mentionObj = MENTIONS.find(m => m.value === mention);
  return mentionObj?.label || mention;
}

/**
 * Obtenir la couleur d'une mention
 */
export function getMentionColor(mention: string): string {
  const mentionObj = MENTIONS.find(m => m.value === mention);
  return mentionObj?.color || 'gray';
}

/**
 * Calculer la moyenne pondérée des notes
 */
export function calculateMoyenne(notes: Array<{valeur: number, coefficient?: number}>): number {
  if (notes.length === 0) return 0;
  
  let sommeNotes = 0;
  let sommeCoefficients = 0;
  
  notes.forEach(note => {
    const coefficient = note.coefficient || 1;
    sommeNotes += note.valeur * coefficient;
    sommeCoefficients += coefficient;
  });
  
  return sommeCoefficients > 0 ? sommeNotes / sommeCoefficients : 0;
}

/**
 * Formater une note pour l'affichage
 */
export function formatNote(note: number): string {
  return note.toFixed(2).replace('.', ',');
}

/**
 * Vérifier si une note est valide (entre 0 et 20)
 */
export function isNoteValide(note: number): boolean {
  return note >= 0 && note <= 20;
}

/**
 * Obtenir la couleur selon la valeur de la note
 */
export function getNoteColor(note: number): string {
  if (note >= 16) return 'text-green-600';
  if (note >= 14) return 'text-blue-600';
  if (note >= 12) return 'text-indigo-600';
  if (note >= 10) return 'text-yellow-600';
  if (note >= 8) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Obtenir l'icône selon la mention
 */
export function getMentionIcon(mention: string): string {
  switch (mention) {
    case 'excellent': return '🏆';
    case 'tres_bien': return '⭐';
    case 'bien': return '👍';
    case 'assez_bien': return '👌';
    case 'passable': return '📚';
    case 'insuffisant': return '⚠️';
    default: return '📋';
  }
}