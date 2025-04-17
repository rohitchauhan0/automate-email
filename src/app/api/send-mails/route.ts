import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type CSVRow = {
  [key: string]: string;
};

export const POST = async (req: NextRequest) => {
  const { rows, subject } = await req.json();
  console.log(rows, subject);

  if (!rows || !Array.isArray(rows)) return NextResponse.json({ error: 'Invalid data format' });

  // Create a mail transporter using environment variables
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    // Loop through each row in the CSV data
    for (const row of rows) {
      const to = row['Email'] || row.email; // Fallback in case the 'Email' key is named differently

      if (!to) continue; // If there's no email, skip this row

      // Get the cold mail prompt (email body) from the row
      const coldMailPrompt = row['Cold Mail Prompt'] || ''; // assuming column name is 'Cold Mail Prompt'

      const personalizedSubject = subject
        .replace(/{{name}}/g, row['Name'] || '')
        .replace(/{{company}}/g, row['Website URL'] || '');

      await transporter.sendMail({
        from: `"Your Name" <${process.env.EMAIL_USER}>`,
        to,
        subject: personalizedSubject,
        html: coldMailPrompt, // Use the cold mail prompt as the email body
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return NextResponse.json({ error: 'Error sending emails' });
  }
};
