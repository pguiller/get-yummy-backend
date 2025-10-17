export const corsOptions = {
  origin: [
    process.env.FRONT_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'http://frontend:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
