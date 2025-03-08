import cors from 'cors';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import { JWT } from 'google-auth-library';
import nodemailer from 'nodemailer';
import express, { Request, Response } from 'express';
import { GoogleSpreadsheet } from 'google-spreadsheet';

dotenv.config();
const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://theshuricollection.com',
      'https://www.theshuricollection.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'HEAD', 'DELETE', 'PATCH'],
  }),
);
app.use(express.json());

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

app.post(
  '/api/shuri-experience/response',
  async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        res
          .status(400)
          .json({ success: false, error: 'Request body is required' });
        return;
      }

      const doc = new GoogleSpreadsheet(
        process.env.GOOGLE_SHEET_ID,
        serviceAccountAuth,
      );
      await doc.loadInfo();

      const sheet = doc.sheetsByIndex[0];

      const expectedBody = [
        'name',
        'email',
        'phone',
        'groupSize',
        'preferredDates',
        'travelDuration',
        'specialInterests',
        'message',
        'newsletter',
        'dataConsent',
      ];

      const bodyKeys = Object.keys(req.body);
      const missingKeys = expectedBody.filter((key) => !bodyKeys.includes(key));

      if (missingKeys.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingKeys.join(', ')}`,
        });
        return;
      }

      await sheet.addRow(req.body);

      await mailer.sendMail({
        from: process.env.SMTP_USERNAME,
        to: process.env.RECEIPENT_EMAIL,
        subject: 'New Experience Request',
        text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nPhone: ${req.body.phone}\nGroup Size: ${req.body.groupSize}\nPreferred Dates: ${req.body.preferredDates}\nTravel Duration: ${req.body.travelDuration}\nSpecial Interests: ${req.body.specialInterests}\nMessage: ${req.body.message}\nNewsletter: ${req.body.newsletter}\nData Consent: ${req.body.dataConsent}`,
      });

      res.status(200).json({ success: true, message: 'Form submitted' });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

app.post(
  '/api/shuri-properties/response',
  async (req: Request, res: Response) => {
    try {
      const doc = new GoogleSpreadsheet(
        process.env.GOOGLE_SHEET_ID,
        serviceAccountAuth,
      );
      await doc.loadInfo();

      const sheet = doc.sheetsByIndex[1];

      const expectedBody = [
        'investorName',
        'investorEmail',
        'investorPhone',
        'country',
        'investmentType',
        'investmentRange',
        'timeline',
        'investorMessage',
      ];

      const bodyKeys = Object.keys(req.body);
      const missingKeys = expectedBody.filter((key) => !bodyKeys.includes(key));

      if (missingKeys.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingKeys.join(', ')}`,
        });
        return;
      }

      await sheet.addRow(req.body);

      await mailer.sendMail({
        from: process.env.SMTP_USERNAME,
        to: process.env.RECEIPENT_EMAIL,
        subject: 'New Property Investment Request',
        text: `Name: ${req.body.investorName}\nEmail: ${req.body.investorEmail}\nPhone: ${req.body.investorPhone}\nCountry: ${req.body.country}\nInvestment Type: ${req.body.investmentType}\nInvestment Range: ${req.body.investmentRange}\nTimeline: ${req.body.timeline}\nMessage: ${req.body.investorMessage}`,
      });

      res.status(200).json({ success: true, message: 'Form submitted' });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

app.post('/api/shuri-contact/response', async (req: Request, res: Response) => {
  try {
    const doc = new GoogleSpreadsheet(
      process.env.GOOGLE_SHEET_ID,
      serviceAccountAuth,
    );
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[2];

    const expectedBody = ['from_name', 'from_email', 'subject', 'message'];

    const bodyKeys = Object.keys(req.body);
    const missingKeys = expectedBody.filter((key) => !bodyKeys.includes(key));

    if (missingKeys.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingKeys.join(', ')}`,
      });
      return;
    }

    await sheet.addRow(req.body);

    await mailer.sendMail({
      from: process.env.SMTP_USERNAME,
      to: process.env.RECEIPENT_EMAIL,
      subject: req.body.subject,
      text: `Name: ${req.body.from_name}\nEmail: ${req.body.from_email}\nMessage: ${
        req.body.message
      }`,
    });

    res.status(200).json({ success: true, message: 'Form submitted' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => {
  console.log(`Server is running on port ${5000}`);
});
module.exports.handler = serverless(app);
