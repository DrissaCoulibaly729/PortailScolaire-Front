import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gradeMention',
  standalone: true
})
export class GradeMentionPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
