import { Frame } from './Frame';
import { genFrameID } from './utils';
import { FRAME_ID_LENGTH } from './constants';

export class GoogleSheetsService {
  private spreadsheetId: string;
  private sheetId: string;

  constructor(spreadsheetUrl: string, sheetId: string = '0') {
    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL');
    }

    this.spreadsheetId = match[1];
    this.sheetId = sheetId;
  }

  /**
   * Fetches CSV data from Google Sheets and parses it into a 16x16 grid
   */
  async fetchGridData(): Promise<number[][]> {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${this.sheetId}`;

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const rows = csvText.trim().split('\n').map(row =>
        row.split(',').map(cell => {
          // Remove quotes and parse as number
          const cleaned = cell.replace(/"/g, '').trim();
          const num = parseInt(cleaned, 10);
          return isNaN(num) ? 0 : num;
        })
      );

      // Ensure we have exactly 16 rows and 16 columns
      const grid: number[][] = [];
      for (let i = 0; i < 16; i++) {
        const row: number[] = [];
        for (let j = 0; j < 16; j++) {
          const value = rows[i] && rows[i][j] !== undefined ? rows[i][j] : 0;
          row.push(value);
        }
        grid.push(row);
      }

      return grid;
    } catch (error) {
      console.error('Error fetching grid data from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Converts a 16x16 grid of numbers to RGB frame data
   * 0 = red, 1 = green
   */
  convertGridToRGBData(grid: number[][]): Uint8Array {
    const rgbData = new Uint8Array(768); // 16x16 * 3 (RGB)
    let index = 0;

    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const value = grid[row][col];

        if (value === 0) {
          // Soft red for 0
          rgbData[index] = 180;   // R
          rgbData[index + 1] = 60; // G
          rgbData[index + 2] = 60; // B
        } else if (value === 1) {
          // Soft green for 1
          rgbData[index] = 60;     // R
          rgbData[index + 1] = 180; // G
          rgbData[index + 2] = 60; // B
        } else {
          // Black for any other value
          rgbData[index] = 0;     // R
          rgbData[index + 1] = 0; // G
          rgbData[index + 2] = 0; // B
        }

        index += 3;
      }
    }

    return rgbData;
  }

  /**
   * Fetches grid data and converts it to a Frame object
   */
  async fetchAsFrame(): Promise<Frame> {
    const grid = await this.fetchGridData();
    const rgbData = this.convertGridToRGBData(grid);
    const frameID = genFrameID(FRAME_ID_LENGTH);

    return new Frame(frameID, rgbData);
  }
}

/**
 * Factory function to create GoogleSheetsService instance
 */
export function createGoogleSheetsService(
  spreadsheetUrl: string,
  sheetId: string = '0'
): GoogleSheetsService {
  return new GoogleSheetsService(spreadsheetUrl, sheetId);
}