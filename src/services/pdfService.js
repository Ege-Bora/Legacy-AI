// PDF Service - Real PDF generation using expo-print
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const pdfService = {
  // Generate PDF from book data
  async generateBookPDF(book, options = {}) {
    try {
      console.log('[PDF] Generating PDF for book:', book.title);
      
      // Generate HTML content for the book
      const htmlContent = this.generateBookHTML(book, options);
      
      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        // Remove format parameter - expo-print defaults to PDF
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      // Create filename with book title and timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const safeTitle = book.title.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeTitle}_${timestamp}.pdf`;
      
      // Move file to documents directory
      const documentsDirectory = FileSystem.documentDirectory;
      const finalUri = documentsDirectory + filename;
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });

      console.log('[PDF] PDF generated successfully:', finalUri);
      
      return {
        success: true,
        uri: finalUri,
        filename: filename,
        fileSize: await this.getFileSize(finalUri),
        pageCount: this.estimatePageCount(book),
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[PDF] Failed to generate PDF:', error);
      throw error;
    }
  },

  // Share the generated PDF
  async sharePDF(pdfUri, filename) {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this platform');
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${filename}`,
        UTI: 'com.adobe.pdf',
      });

      return { success: true };
    } catch (error) {
      console.error('[PDF] Failed to share PDF:', error);
      throw error;
    }
  },

  // Generate HTML content for the book
  generateBookHTML(book, options = {}) {
    const {
      includeCoverPage = true,
      includeTableOfContents = true,
      chapterStartsNewPage = true,
      fontSize = '12px',
      fontFamily = 'serif',
      lineHeight = '1.6'
    } = options;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${book.title}</title>
  <style>
    body {
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${lineHeight};
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .cover-page {
      text-align: center;
      page-break-after: always;
      margin-top: 200px;
    }
    .cover-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #2563eb;
    }
    .cover-subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
      font-style: italic;
    }
    .cover-author {
      font-size: 16px;
      color: #333;
      margin-top: 60px;
    }
    .cover-date {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
    }
    .toc {
      page-break-after: always;
      margin-top: 40px;
    }
    .toc-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 30px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    .toc-item {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #ccc;
      padding-bottom: 4px;
    }
    .chapter {
      ${chapterStartsNewPage ? 'page-break-before: always;' : ''}
      margin-bottom: 40px;
    }
    .chapter-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #2563eb;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .chapter-content {
      text-align: justify;
      margin-bottom: 30px;
    }
    .chapter-content p {
      margin-bottom: 16px;
    }
    .book-stats {
      margin-top: 40px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      font-size: 11px;
      color: #666;
    }
    @media print {
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>`;

    // Cover Page
    if (includeCoverPage) {
      html += `
  <div class="cover-page">
    <h1 class="cover-title">${book.title}</h1>
    ${book.subtitle ? `<h2 class="cover-subtitle">${book.subtitle}</h2>` : ''}
    <p class="cover-author">by ${book.author}</p>
    <p class="cover-date">Generated on ${new Date().toLocaleDateString()}</p>
  </div>`;
    }

    // Table of Contents
    if (includeTableOfContents && book.chapters.length > 0) {
      html += `
  <div class="toc">
    <h2 class="toc-title">Table of Contents</h2>`;
      
      book.chapters.forEach((chapter, index) => {
        html += `
    <div class="toc-item">
      <span>Chapter ${index + 1}: ${chapter.title}</span>
      <span>${index + 1}</span>
    </div>`;
      });
      
      html += `
  </div>`;
    }

    // Chapters
    book.chapters.forEach((chapter, index) => {
      html += `
  <div class="chapter">
    <h2 class="chapter-title">Chapter ${index + 1}: ${chapter.title}</h2>
    <div class="chapter-content">
      ${this.formatChapterContent(chapter.content)}
    </div>
  </div>`;
    });

    // Book Statistics
    html += `
  <div class="book-stats">
    <h3>Book Statistics</h3>
    <p><strong>Total Chapters:</strong> ${book.chapters.length}</p>
    <p><strong>Total Words:</strong> ${book.metadata.totalWords.toLocaleString()}</p>
    <p><strong>Estimated Pages:</strong> ${book.metadata.estimatedPages}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Status:</strong> ${book.progress * 100}% Complete</p>
  </div>
</body>
</html>`;

    return html;
  },

  // Format chapter content for HTML
  formatChapterContent(content) {
    // Split content into paragraphs and wrap each in <p> tags
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n    ');
  },

  // Estimate page count based on word count
  estimatePageCount(book) {
    // Rough estimate: 250 words per page
    return Math.ceil(book.metadata.totalWords / 250);
  },

  // Get file size in human readable format
  async getFileSize(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        const sizeInMB = fileInfo.size / (1024 * 1024);
        return `${sizeInMB.toFixed(1)} MB`;
      }
      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  },

  // Export options for different formats
  getExportOptions() {
    return {
      standard: {
        fontSize: '12px',
        fontFamily: 'serif',
        lineHeight: '1.6',
        includeCoverPage: true,
        includeTableOfContents: true,
        chapterStartsNewPage: true
      },
      compact: {
        fontSize: '11px',
        fontFamily: 'sans-serif',
        lineHeight: '1.4',
        includeCoverPage: true,
        includeTableOfContents: false,
        chapterStartsNewPage: false
      },
      large: {
        fontSize: '14px',
        fontFamily: 'serif',
        lineHeight: '1.8',
        includeCoverPage: true,
        includeTableOfContents: true,
        chapterStartsNewPage: true
      }
    };
  }
};