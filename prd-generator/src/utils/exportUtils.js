// Export Utilities for PRD Generator
// Handles PDF, DOCX, and JSON exports

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

/**
 * Parse markdown content into structured sections
 * @param {string} markdown - The markdown content
 * @returns {Array<{type: string, level?: number, content: string}>}
 */
const parseMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const elements = [];

  lines.forEach(line => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('# ')) {
      elements.push({ type: 'heading', level: 1, content: trimmedLine.slice(2) });
    } else if (trimmedLine.startsWith('## ')) {
      elements.push({ type: 'heading', level: 2, content: trimmedLine.slice(3) });
    } else if (trimmedLine.startsWith('### ')) {
      elements.push({ type: 'heading', level: 3, content: trimmedLine.slice(4) });
    } else if (trimmedLine.startsWith('#### ')) {
      elements.push({ type: 'heading', level: 4, content: trimmedLine.slice(5) });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
      elements.push({ type: 'bullet', content: trimmedLine.slice(2) });
    } else if (trimmedLine.startsWith('* ')) {
      elements.push({ type: 'bullet', content: trimmedLine.slice(2) });
    } else if (/^\d+\.\s/.test(trimmedLine)) {
      elements.push({ type: 'numbered', content: trimmedLine });
    } else if (trimmedLine === '---') {
      elements.push({ type: 'separator' });
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      elements.push({ type: 'bold', content: trimmedLine.slice(2, -2) });
    } else if (trimmedLine) {
      elements.push({ type: 'paragraph', content: trimmedLine });
    } else {
      elements.push({ type: 'space' });
    }
  });

  return elements;
};

/**
 * Remove markdown formatting from text
 * @param {string} text - Text with markdown
 * @returns {string}
 */
const stripMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
};

/**
 * Export PRD to PDF format
 * @param {string} prdContent - The PRD content in markdown
 * @param {object} formData - Form data for metadata
 * @returns {Promise<Blob>}
 */
export const exportToPDF = async (prdContent, formData) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight = 10) => {
    if (yPosition + neededHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header with gradient effect (simulated with rectangle)
  pdf.setFillColor(0, 147, 182); // Primary color
  pdf.rect(0, 0, pageWidth, 35, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Product Requirements Document', margin, 20);

  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${formData.appName || 'Application'} | Version ${formData.prdVersion || '1.0'}`, margin, 28);

  yPosition = 45;

  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // Parse and render content
  const elements = parseMarkdown(prdContent);

  elements.forEach(element => {
    switch (element.type) {
      case 'heading':
        checkPageBreak(15);
        if (element.level === 1) {
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 147, 182);
        } else if (element.level === 2) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 147, 182);
        } else {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
        }
        const headingLines = pdf.splitTextToSize(stripMarkdown(element.content), contentWidth);
        pdf.text(headingLines, margin, yPosition);
        yPosition += (headingLines.length * 6) + 4;
        pdf.setTextColor(0, 0, 0);
        break;

      case 'paragraph':
      case 'bold':
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', element.type === 'bold' ? 'bold' : 'normal');
        const paraLines = pdf.splitTextToSize(stripMarkdown(element.content), contentWidth);
        pdf.text(paraLines, margin, yPosition);
        yPosition += (paraLines.length * 5) + 2;
        break;

      case 'bullet':
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const bulletText = `• ${stripMarkdown(element.content)}`;
        const bulletLines = pdf.splitTextToSize(bulletText, contentWidth - 5);
        pdf.text(bulletLines, margin + 5, yPosition);
        yPosition += (bulletLines.length * 5) + 1;
        break;

      case 'numbered':
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const numberedLines = pdf.splitTextToSize(stripMarkdown(element.content), contentWidth - 5);
        pdf.text(numberedLines, margin + 5, yPosition);
        yPosition += (numberedLines.length * 5) + 1;
        break;

      case 'separator':
        checkPageBreak(10);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        break;

      case 'space':
        yPosition += 3;
        break;
    }
  });

  // Footer on each page
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Powered by ISTVON PRD Prompt Framework | Generated by BuLLMake PRD Generator`, margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  return pdf.output('blob');
};

/**
 * Export PRD to DOCX format
 * @param {string} prdContent - The PRD content in markdown
 * @param {object} formData - Form data for metadata
 * @returns {Promise<Blob>}
 */
export const exportToDOCX = async (prdContent, formData) => {
  const elements = parseMarkdown(prdContent);
  const children = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Product Requirements Document',
          bold: true,
          size: 48,
          color: '0093B6'
        })
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 }
    })
  );

  // Subtitle
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${formData.appName || 'Application'} | Version ${formData.prdVersion || '1.0'} | ${new Date().toLocaleDateString()}`,
          size: 24,
          color: '666666'
        })
      ],
      spacing: { after: 400 }
    })
  );

  // Horizontal line
  children.push(
    new Paragraph({
      border: {
        bottom: { color: 'CCCCCC', size: 1, style: BorderStyle.SINGLE }
      },
      spacing: { after: 400 }
    })
  );

  // Process content
  elements.forEach(element => {
    switch (element.type) {
      case 'heading':
        const headingLevel = element.level === 1 ? HeadingLevel.HEADING_1 :
          element.level === 2 ? HeadingLevel.HEADING_2 :
            element.level === 3 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: stripMarkdown(element.content),
                bold: true,
                size: element.level === 1 ? 32 : element.level === 2 ? 28 : 24,
                color: element.level === 1 ? '0093B6' : element.level === 2 ? '0093B6' : '000000'
              })
            ],
            heading: headingLevel,
            spacing: { before: 300, after: 150 }
          })
        );
        break;

      case 'paragraph':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripMarkdown(element.content), size: 22 })],
            spacing: { after: 120 }
          })
        );
        break;

      case 'bold':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripMarkdown(element.content), bold: true, size: 22 })],
            spacing: { after: 120 }
          })
        );
        break;

      case 'bullet':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripMarkdown(element.content), size: 22 })],
            bullet: { level: 0 },
            spacing: { after: 60 }
          })
        );
        break;

      case 'numbered':
        children.push(
          new Paragraph({
            children: [new TextRun({ text: stripMarkdown(element.content), size: 22 })],
            spacing: { after: 60 }
          })
        );
        break;

      case 'separator':
        children.push(
          new Paragraph({
            border: {
              bottom: { color: 'CCCCCC', size: 1, style: BorderStyle.SINGLE }
            },
            spacing: { before: 200, after: 200 }
          })
        );
        break;

      case 'space':
        children.push(new Paragraph({ spacing: { after: 100 } }));
        break;
    }
  });

  // Footer
  children.push(
    new Paragraph({
      border: {
        top: { color: 'CCCCCC', size: 1, style: BorderStyle.SINGLE }
      },
      spacing: { before: 400 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Powered by ISTVON PRD Prompt Framework | Generated by BuLLMake PRD Generator',
          size: 18,
          color: '999999',
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return Packer.toBlob(doc);
};

/**
 * Export PRD and form data to JSON format
 * @param {string} prdContent - The PRD content
 * @param {object} formData - Complete form data
 * @returns {Blob}
 */
export const exportToJSON = (prdContent, formData) => {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: formData.prdVersion || '1.0',
      generator: 'BuLLMake PRD Generator',
      framework: 'ISTVON PRD Prompt Framework'
    },
    project: {
      name: formData.appName,
      idea: formData.appIdea,
      platform: formData.platform,
      type: formData.projectType,
      dueDate: formData.dueDate
    },
    requirements: {
      problemStatement: formData.problemStatement,
      goal: formData.goal,
      outOfScope: formData.outOfScope
    },
    targetAudience: {
      demography: formData.targetAudienceDemography,
      geography: formData.targetAudienceGeography
    },
    technical: {
      appStructure: formData.appStructure,
      techStack: formData.selectedTechStack,
      competitors: formData.competitors
    },
    design: {
      colors: {
        primary: formData.primaryColor,
        secondary: formData.secondaryColor,
        accent: formData.accentColor,
        chart: [
          formData.chartColor1,
          formData.chartColor2,
          formData.chartColor3,
          formData.chartColor4,
          formData.chartColor5
        ]
      },
      typography: {
        primaryFont: formData.primaryFont,
        headingsFont: formData.headingsFont,
        sizes: {
          h1: formData.h1Size,
          h2: formData.h2Size,
          h3: formData.h3Size,
          h4: formData.h4Size,
          h5: formData.h5Size,
          body: formData.bodySize
        }
      },
      images: {
        borderRadius: formData.imageBorderRadius,
        aspectRatio: formData.imageAspectRatio,
        quality: formData.imageQuality,
        guidelines: formData.imageGuidelines
      },
      charts: {
        guidelines: formData.chartGuidelines
      }
    },
    timeline: {
      milestones: formData.milestones,
      team: formData.assignedTeam
    },
    prd: {
      content: prdContent,
      generatedAt: new Date().toISOString()
    }
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
};

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export PRD in the specified format
 * @param {string} format - 'pdf', 'docx', or 'json'
 * @param {string} prdContent - The PRD content
 * @param {object} formData - Form data
 */
export const exportPRD = async (format, prdContent, formData) => {
  const timestamp = Date.now();
  const appName = formData.appName || 'PRD';

  try {
    let blob;
    let filename;

    switch (format.toLowerCase()) {
      case 'pdf':
        blob = await exportToPDF(prdContent, formData);
        filename = `${appName}-PRD-${timestamp}.pdf`;
        break;

      case 'docx':
      case 'doc':
        blob = await exportToDOCX(prdContent, formData);
        filename = `${appName}-PRD-${timestamp}.docx`;
        break;

      case 'json':
        blob = exportToJSON(prdContent, formData);
        filename = `${appName}-PRD-${timestamp}.json`;
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    downloadBlob(blob, filename);
    return { success: true, filename };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
};
