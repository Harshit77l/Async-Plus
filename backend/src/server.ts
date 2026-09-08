import dotenv from 'dotenv';
import { createApp } from './app.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AsyncPulse backend running on http://0.0.0.0:${PORT}`);
});
