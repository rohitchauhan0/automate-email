import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type CSVRow = {
  [key: string]: string;
};

export const POST = async (req: NextRequest) => {
  const { rows, subject } = await req.json();
  console.log(rows, subject);

  if (!rows || !Array.isArray(rows)) return NextResponse.json({ error: 'Invalid data format' });

  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  try {
    
    for (const row of rows) {
      const to = row['Email'] || row.email; 

      if (!to) continue; 

      const coldMailPrompt = row['Cold Mail Prompt'] || ''; 

      const personalizedSubject = subject
        .replace(/{{name}}/g, row['Name'] || '')
        .replace(/{{company}}/g, row['Website URL'] || '');

      await transporter.sendMail({
        from: `"Your Name" <${process.env.EMAIL_USER}>`,
        to,
        subject: personalizedSubject,
        html: coldMailPrompt,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return NextResponse.json({ error: 'Error sending emails' });
  }
};
