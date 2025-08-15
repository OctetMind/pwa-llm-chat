const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const jwt = require('@fastify/jwt');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Load environment variables (e.g., from .env file in a real project)
// For Vercel, these would be configured as environment variables directly.
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // CHANGE THIS IN PRODUCTION
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@host:port/database'; // CHANGE THIS

const pool = new Pool({
  connectionString: DATABASE_URL,
});

fastify.register(cors, {
  origin: '*', // Adjust this to your frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

fastify.register(helmet);

fastify.register(rateLimit, {
  max: 100, // Max requests per windowMs
  timeWindow: '1 minute',
});

fastify.register(jwt, {
  secret: JWT_SECRET,
});

// Decorate Fastify instance with authentication utility
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Routes
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// User Registration
fastify.post('/register', async (request, reply) => {
  const { username, password } = request.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    reply.code(201).send({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation (e.g., username already exists)
      reply.code(409).send({ message: 'Username already exists' });
    } else {
      fastify.log.error(err);
      reply.code(500).send({ message: 'Internal server error' });
    }
  }
});

// User Login
fastify.post('/login', async (request, reply) => {
  const { username, password } = request.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({ id: user.id, username: user.username });
    reply.send({ token });
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});

// Protected route example
fastify.get('/profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  reply.send({ user: request.user });
});

// Prompt Management Routes
// Create a new prompt
fastify.post('/prompts', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  const { title, content, is_public } = request.body;
  const userId = request.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO prompts (user_id, title, content, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, content, is_public]
    );
    reply.code(201).send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});

// Get all prompts for the authenticated user
fastify.get('/prompts', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  const userId = request.user.id;
  try {
    const result = await pool.query('SELECT * FROM prompts WHERE user_id = $1', [userId]);
    reply.send(result.rows);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});

// Get a specific prompt by ID
fastify.get('/prompts/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const userId = request.user.id;
  try {
    const result = await pool.query('SELECT * FROM prompts WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return reply.code(404).send({ message: 'Prompt not found' });
    }
    reply.send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});

// Update a specific prompt by ID
fastify.put('/prompts/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const { title, content, is_public } = request.body;
  const userId = request.user.id;
  try {
    const result = await pool.query(
      'UPDATE prompts SET title = $1, content = $2, is_public = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, content, is_public, id, userId]
    );
    if (result.rows.length === 0) {
      return reply.code(404).send({ message: 'Prompt not found' });
    }
    reply.send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});

// Delete a specific prompt by ID
fastify.delete('/prompts/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
  const { id } = request.params;
  const userId = request.user.id;
  try {
    const result = await pool.query('DELETE FROM prompts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) {
      return reply.code(404).send({ message: 'Prompt not found' });
    }
    reply.code(204).send(); // No content for successful deletion
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});


// Run the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Get all public prompts
fastify.get('/prompts/public', async (request, reply) => {
  try {
    const result = await pool.query('SELECT id, user_id, title, content, created_at, updated_at FROM prompts WHERE is_public = TRUE');
    reply.send(result.rows);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ message: 'Internal server error' });
  }
});

start();