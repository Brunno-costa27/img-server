// server.js
const Fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const FastifyMultipart = require('@fastify/multipart');
const FastifyStatic = require('@fastify/static');
const FastifyCors = require('@fastify/cors');

const app = Fastify();

app.register(FastifyCors, {
    origin: true, // Permite apenas a origem especificada
    methods: ['GET', 'POST'], // Permite apenas os métodos especificados
    allowedHeaders: ['Content-Type'], // Permite apenas os cabeçalhos especificados
  });

// Diretório onde as imagens serão salvas
const uploadDir = path.join(__dirname, 'uploads');

// Garantir que o diretório de uploads exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Registra o plugin multipart para manipular uploads de arquivos
app.register(FastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // Limite de tamanho de arquivo (50 MB)
  }
});

// Configurar Fastify para servir arquivos estáticos
app.register(FastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/', // Prefixo para acessar os arquivos
  });
  

// Rota para fazer o upload das imagens
app.post('/upload', async (request, reply) => {
  const data = await request.file();
  const fileName = data.filename;
  const filePath = path.join(uploadDir, fileName);

  const writeStream = fs.createWriteStream(filePath);
  data.file.pipe(writeStream);

  writeStream.on('finish', () => {
    reply.send({ status: 'success', fileName: fileName });
  });

  writeStream.on('error', (err) => {
    reply.status(500).send({ error: 'Failed to upload file', details: err.message });
  });
});

// Rota para listar arquivos
app.get('/uploads', async (request, reply) => {
    try {
      const files = fs.readdirSync(uploadDir);
      reply.send(files);
    } catch (error) {
      reply.status(500).send({ message: 'Erro ao listar arquivos' });
    }
  });

/// Rota personalizada para fornecer imagens
app.get('/uploads/:filename', async (request, reply) => {
    const filename = request.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
  
    try {
      const file = fs.readFileSync(filePath);
      reply.type('image/jpg'); // Ajuste o tipo MIME conforme necessário
      reply.send(file);
    } catch (err) {
      reply.status(404).send({ message: 'Arquivo não encontrado' });
    }
  });

app.get('/', async (req, reply) =>{
  reply.send({message: "Deu certo"})
})

// Inicia o servidor
app.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

// module.exports = async (req, res) => {
//   await app.ready();
//   app.server.emit('request', req, res);
// };