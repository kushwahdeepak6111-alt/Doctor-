import 'dotenv/config';
import serverless from 'serverless-http';
import { createClinicApp } from '../../server/app.ts';

const app = createClinicApp();

export const handler = serverless(app);
