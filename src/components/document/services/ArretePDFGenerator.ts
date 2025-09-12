import jsPDF from 'jspdf';
import { ArreteSection } from './ArreteContentParser';

export interface ArreteMetadata {
  commune: string;
  numero: string;
  maire: string;
  logo: string | null;
}

export class ArretePDFGenerator {
  private static readonly LEFT_MARGIN = 20;
  private static readonly RIGHT_MARGIN = 190;
  private static readonly LINE_HEIGHT = 6;

  static async generatePDF(metadata: ArreteMetadata, sections: ArreteSection): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;

    // En-tête avec logo
    if (metadata.logo) {
      try {
        pdf.addImage(metadata.logo, 'JPEG', this.LEFT_MARGIN, yPosition, 30, 20);
        yPosition += 25;
      } catch (error) {
        console.warn('Erreur lors de l\'ajout du logo:', error);
      }
    }

    // Informations de la commune
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`COMMUNE DE ${metadata.commune.toUpperCase()}`, this.LEFT_MARGIN, yPosition);
    yPosition += 10;

    // Titre de l'arrêté
    pdf.setFontSize(14);
    pdf.text(`ARRÊTÉ N° ${metadata.numero}`, this.LEFT_MARGIN, yPosition);
    yPosition += 15;

    // Visas
    yPosition = this.addSection(pdf, sections.visas, yPosition);

    // Considérants
    yPosition = this.addSection(pdf, sections.considerants, yPosition);

    // Partie décisionnelle
    pdf.setFont('helvetica', 'bold');
    pdf.text('ARRÊTE :', this.LEFT_MARGIN, yPosition);
    yPosition += 10;

    // Articles
    pdf.setFont('helvetica', 'normal');
    sections.articles.forEach(article => {
      const splitText = pdf.splitTextToSize(article, this.RIGHT_MARGIN - this.LEFT_MARGIN);
      pdf.text(splitText, this.LEFT_MARGIN, yPosition);
      yPosition += splitText.length * this.LINE_HEIGHT + 3;

      // Nouvelle page si nécessaire
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
    });

    // Signature
    yPosition = this.addSignature(pdf, metadata, yPosition);
    
    // Télécharger le PDF
    const fileName = `arrete_${metadata.numero}_${metadata.commune.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
  }

  private static addSection(pdf: jsPDF, items: string[], yPosition: number): number {
    if (items.length === 0) return yPosition;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    items.forEach(item => {
      const splitText = pdf.splitTextToSize(item, this.RIGHT_MARGIN - this.LEFT_MARGIN);
      pdf.text(splitText, this.LEFT_MARGIN, yPosition);
      yPosition += splitText.length * this.LINE_HEIGHT;
    });
    
    return yPosition + 5;
  }

  private static addSignature(pdf: jsPDF, metadata: ArreteMetadata, yPosition: number): number {
    yPosition += 10;
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.text(`Fait à ${metadata.commune}, le ${new Date().toLocaleDateString('fr-FR')}`, this.LEFT_MARGIN, yPosition);
    yPosition += 10;
    pdf.text('Le Maire,', this.LEFT_MARGIN, yPosition);

    if (metadata.maire) {
      yPosition += 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text(metadata.maire, this.LEFT_MARGIN, yPosition);
    }

    return yPosition;
  }
}