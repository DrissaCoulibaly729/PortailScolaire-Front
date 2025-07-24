import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="containerClass">
      <div class="flex flex-col items-center justify-center">
        <!-- Spinner -->
        <div class="relative">
          <div [class]="spinnerClass">
            <div class="absolute top-0 left-0 w-full h-full border-2 border-gray-200 rounded-full"></div>
            <div [class]="animatedBorderClass"></div>
          </div>
        </div>
        
        <!-- Message -->
        <div *ngIf="message" class="mt-4 text-center">
          <p [class]="messageClass">{{ message }}</p>
          <p *ngIf="subMessage" class="text-sm text-gray-500 mt-1">{{ subMessage }}</p>
        </div>
      </div>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() message: string = '';
  @Input() subMessage: string = '';
  @Input() overlay: boolean = false;
  @Input() fullscreen: boolean = false;

  get containerClass(): string {
    let baseClass = 'flex items-center justify-center';
    
    if (this.fullscreen) {
      baseClass += ' fixed inset-0 z-50';
    }
    
    if (this.overlay) {
      baseClass += ' bg-white bg-opacity-75';
    }
    
    return baseClass;
  }

  get spinnerClass(): string {
    const sizes = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    return `relative ${sizes[this.size]}`;
  }

  get animatedBorderClass(): string {
    const sizes = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    return `absolute top-0 left-0 ${sizes[this.size]} border-2 border-transparent border-t-blue-600 border-r-blue-600 rounded-full animate-spin`;
  }

  get messageClass(): string {
    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl'
    };
    return `font-medium text-gray-700 ${sizes[this.size]}`;
  }
}
