import { Component, Input, ViewChild, ElementRef, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-base-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <canvas #chartCanvas></canvas>
      <div *ngIf="isLoading" class="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
        <div class="flex items-center space-x-2">
          <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-gray-600">Chargement du graphique...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    canvas {
      max-width: 100%;
      height: auto;
    }
  `]
})
export class BaseChartComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() type: ChartType = 'line';
  @Input() data: any = null;
  @Input() options: any = {};
  @Input() isLoading = false;
  @Input() height: number = 300;

  private chart: Chart | null = null;

  ngOnInit(): void {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart(): void {
    if (!this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Configuration par défaut
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          backgroundColor: '#374151',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#6b7280',
          borderWidth: 1,
          cornerRadius: 8,
        }
      },
      scales: this.type !== 'doughnut' && this.type !== 'pie' ? {
        x: {
          grid: {
            color: '#f3f4f6',
          }
        },
        y: {
          grid: {
            color: '#f3f4f6',
          },
          beginAtZero: true
        }
      } : {}
    };

    const config: ChartConfiguration = {
      type: this.type,
      data: this.data,
      options: { ...defaultOptions, ...this.options }
    };

    // Définir la hauteur du canvas
    this.chartCanvas.nativeElement.height = this.height;

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (this.chart && this.data) {
      this.chart.data = this.data;
      this.chart.update();
    } else {
      this.initChart();
    }
  }

  /**
   * Méthode publique pour mettre à jour les données
   */
  updateData(newData: any): void {
    this.data = newData;
    this.updateChart();
  }

  /**
   * Méthode publique pour exporter le graphique en image
   */
  exportAsImage(): string | undefined {
    return this.chart?.toBase64Image();
  }
}
