import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express()
const PORT = process.env.PORT || 3000;

const isDev = process.env.NODE_ENV === 'development';
const apiUrl: string = isDev ? 'http://localhost:3000' : 'https://api.sylvain-nas.ovh';

// Middleware
app.use(cors({
  origin: isDev
    ? ['http://localhost:5173', 'http://localhost:3000']  // Dev
    : [
        `https://${process.env.DOMAIN}`,
        `https://www.${process.env.DOMAIN}`,
      ],  // Prod
  credentials: true,
}));
app.use(express.json());

// Database configuration
const dbConfig = {
    host: isDev ? 'localhost' : process.env.DB_HOST || 'mariadb',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}

// connection pool
let pool: mysql.Pool;

async function initDatabase() {
  const maxRetries = 30;
  const retryDelay = 3000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
        pool = mysql.createPool(dbConfig);
        await pool.query('SELECT 1');
        console.log('Connection to MariaDb succeed');
        return;
    } catch(error) {
      console.log(`Tentative ${i + 1}/${maxRetries} - MariaDB not ready yet, next try in ${retryDelay/1000}s...`);
      if (i === maxRetries - 1) {
        console.error('Impossible to connect to MariaDb after ', maxRetries, ' tentatives');
        console.error('Connection error to MariaDb: ', error);
      } else {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }    
    }
  }
    try {

    } catch(error) {
        console.error('Connection error to MariaDb: ', error);
    }
}

// Routes

app.get('/api/error400', (req, res) => {
  res.status(400).send('Custom Bad Request');
});

app.get('/api/error500', (req, res) => {
  res.status(500).send('Custom Internal Server Error');
});

app.get('/api/error400json', (req, res) => {
  res.status(400).json({ error: 'Bad Request' });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'online',
        timeStamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Main Route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'API Node.js on Raspberry PI 5',
        version: '1.0.0',
        endpoints: [
            'GET /',
            'GET /health',
            'GET /status',
            'GET /hello/:name',
            'POST /test',
            'GET /db-test',
            'GET /users'
        ]
    });
});

// Hello with parameters
app.get('/hello/:name', (req: Request, res: Response) => {
    const name = req.params;
    res.json({
        message: `Bonjour ${name}!`,
        timetamp: new Date().toISOString(),
    });
});

// Test POST
app.post('/test', (req: Request, res: Response) => {
  const data = req.body;
  res.json({
    message: 'Data received',
    received: data,
    timestamp: new Date().toISOString()
  });
});

// System status
app.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

// database connection test
app.get('/db-test', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT NOW() as now, VERSION() as version');
    res.json({
      message: 'Database connection succeed',
      data: rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection error',
      message: error instanceof Error ? error.message : 'Unknow error'
    });
  }
});

app.get('/users', async (req: Request, res: Response) => {
  
  try {
    const [rows] = await pool.query(`SELECT * FROM user`);
    res.json(rows);
  } catch(err) {
    res.status(500).json({
      error: 'Database query error',
      message: err instanceof Error ? err.message : 'Unknow error'
    });
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).send(errorPage(404, 'Page not found'));
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error: ', err);
  res.status(500).send(errorPage(500, 'Internal server error'));
});


function errorPage(statusCode: number, message: string): string {
    const titles: Record<number, string> = {
    400: 'Requête incorrecte',
    404: 'Page non trouvée',
    500: 'Erreur serveur'
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Erreur ${statusCode}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 60px 40px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .error-code {
          font-size: 120px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          color: #333;
          margin-bottom: 15px;
        }
        p {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .btn {
          display: inline-block;
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        .details {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-code">${statusCode}</div>
        <h1>${titles[statusCode] || 'Erreur'}</h1>
        <p>${message}</p>
        <a href="/" class="btn">Retour à l'accueil</a>
        <div class="details">
          Si le problème persiste, contactez l'administrateur
        </div>
      </div>
    </body>
    </html>
  `;
}

async function startServer() {
    await initDatabase();

    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Can access on: ${apiUrl}`);
    })
}

startServer();
