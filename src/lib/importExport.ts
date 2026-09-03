import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db, Flashcard } from './db';

export interface ImportedCard {
  front: string;
  back: string;
  imageUrl?: string;
}

export const importFromCSV = (file: File): Promise<ImportedCard[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('CSV data parsed:', results.data);
        console.log('First row:', results.data[0]);
        
        // More flexible column name matching
        const cards = results.data.map((row: any) => {
          const keys = Object.keys(row);
          console.log('Row keys:', keys);
          
          // Find columns (case-insensitive)
          const frontKey = keys.find(k => k.toLowerCase().includes('front') || k.toLowerCase().includes('question'));
          const backKey = keys.find(k => k.toLowerCase().includes('back') || k.toLowerCase().includes('answer'));
          const imageKey = keys.find(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('img'));
          
          const front = frontKey ? String(row[frontKey]).trim() : '';
          const back = backKey ? String(row[backKey]).trim() : '';
          const imageUrl = imageKey ? String(row[imageKey]).trim() : '';
          
          console.log('Mapped card:', { front, back, imageUrl });
          
          return { front, back, imageUrl };
        }).filter(card => card.front && card.back);
        
        console.log('Filtered cards:', cards);
        resolve(cards);
      },
      error: (error) => {
        console.error('CSV import error:', error);
        reject(error);
      },
    });
  });
};

export const importFromExcel = async (file: File): Promise<ImportedCard[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        console.log('Excel data parsed:', jsonData);
        console.log('First row:', jsonData[0]);
        
        // More flexible column name matching
        const cards = jsonData.map((row: any) => {
          // Get all keys from the row
          const keys = Object.keys(row);
          console.log('Row keys:', keys);
          
          // Find front column (case-insensitive)
          const frontKey = keys.find(k => k.toLowerCase().includes('front') || k.toLowerCase().includes('question'));
          const backKey = keys.find(k => k.toLowerCase().includes('back') || k.toLowerCase().includes('answer'));
          const imageKey = keys.find(k => k.toLowerCase().includes('image') || k.toLowerCase().includes('img'));
          
          const front = frontKey ? String(row[frontKey]).trim() : '';
          const back = backKey ? String(row[backKey]).trim() : '';
          const imageUrl = imageKey ? String(row[imageKey]).trim() : '';
          
          console.log('Mapped card:', { front, back, imageUrl });
          
          return { front, back, imageUrl };
        }).filter(card => card.front && card.back);
        
        console.log('Filtered cards:', cards);
        resolve(cards);
      } catch (error) {
        console.error('Excel import error:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportToCSV = async (deckId: number, deckName: string) => {
  const cards = await db.flashcards.where('deckId').equals(deckId).toArray();
  const data = cards.map(card => ({
    front: card.front,
    back: card.back,
    imageUrl: card.imageUrl || '',
  }));
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${deckName.replace(/\s+/g, '_')}_flashcards.csv`;
  link.click();
};

export const exportToExcel = async (deckId: number, deckName: string) => {
  const cards = await db.flashcards.where('deckId').equals(deckId).toArray();
  const data = cards.map(card => ({
    front: card.front,
    back: card.back,
    imageUrl: card.imageUrl || '',
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Flashcards');
  XLSX.writeFile(workbook, `${deckName.replace(/\s+/g, '_')}_flashcards.xlsx`);
};