import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'noteMention',
  standalone: true
})
export class NoteMentionPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
