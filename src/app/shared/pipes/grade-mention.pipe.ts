import { Pipe, PipeTransform } from '@angular/core';
import { getMentionFromNote, getMentionLabel } from '../models/notes-bulletins.model';

@Pipe({
  name: 'gradeMention',
  standalone: true
})
export class GradeMentionPipe implements PipeTransform {
  transform(note: number): string {
    const mention = getMentionFromNote(note);
    return getMentionLabel(mention);
  }
}