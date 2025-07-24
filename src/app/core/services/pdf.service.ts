import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bulletin } from '../../shared/models/notes-bulletins.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  /**
   * Générer un PDF de bulletin (simulation)
   */
  generateBulletinPDF(bulletin: Bulletin): Observable<Blob> {
    return new Observable(observer => {
      // Simulation de génération PDF
      setTimeout(() => {
        const pdfContent = this.createMockPDF(bulletin);
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        observer.next(blob);
        observer.complete();
      }, 2000);
    });
  }

  /**
   * Télécharger un PDF
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Créer un PDF simulé (pour démo)
   */
  private createMockPDF(bulletin: Bulletin): string {
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
  /Font <<
    /F1 4 0 R
  >>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(BULLETIN DE NOTES) Tj
0 -20 Td
(Élève: ${bulletin.eleve?.nom} ${bulletin.eleve?.prenom}) Tj
0 -20 Td
(Période: ${bulletin.periode?.nom}) Tj
0 -20 Td
(Moyenne générale: ${bulletin.moyenne_generale}/20) Tj
0 -20 Td
(Mention: ${bulletin.mention}) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;
  }
}
