import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';

// POST /api/access-lists/import-csv - Parse and validate CSV data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { csvContent, delimiter = ',' } = body;

    if (!csvContent) {
      return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
    }

    // Parse CSV content
    const lines = csvContent.trim().split('\n');
    
    if (lines.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Parse header row
    const headerRow = lines[0].split(delimiter).map((header: string) => header.trim().toLowerCase());
    
    // Find email and name columns
    const emailColumnIndex = headerRow.findIndex((header: string) => 
      header.includes('email') || header.includes('e-mail') || header.includes('mail')
    );
    
    const nameColumnIndex = headerRow.findIndex((header: string) => 
      header.includes('name') || header.includes('full name') || header.includes('fullname')
    );

    if (emailColumnIndex === -1) {
      return NextResponse.json({ 
        error: 'No email column found. Please ensure your CSV has a column with "email" in the header.' 
      }, { status: 400 });
    }

    // Parse data rows
    const users = [];
    const errors = [];
    const duplicateEmails = new Set();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter);
      
      if (row.length < headerRow.length) {
        errors.push(`Row ${i + 1}: Insufficient columns`);
        continue;
      }

      const email = row[emailColumnIndex]?.trim().toLowerCase();
      const name = nameColumnIndex !== -1 ? row[nameColumnIndex]?.trim() : '';

      if (!email) {
        errors.push(`Row ${i + 1}: Email is required`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Row ${i + 1}: Invalid email format: ${email}`);
        continue;
      }

      // Check for duplicates in CSV
      if (duplicateEmails.has(email)) {
        errors.push(`Row ${i + 1}: Duplicate email: ${email}`);
        continue;
      }
      duplicateEmails.add(email);

      users.push({
        email,
        name: name || '',
        rowNumber: i + 1
      });
    }

    // Summary statistics
    const summary = {
      totalRows: lines.length - 1,
      validUsers: users.length,
      errors: errors.length,
      duplicatesFound: lines.length - 1 - users.length - errors.length
    };

    return NextResponse.json({
      success: true,
      users,
      errors,
      summary,
      headers: headerRow,
      detectedColumns: {
        email: emailColumnIndex,
        name: nameColumnIndex
      }
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 500 });
  }
}
