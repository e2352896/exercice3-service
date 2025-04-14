const knex = require('knex');
const bcryptjs = require('bcryptjs'); // Importer bcryptjs pour hacher le mot de passe

// Initialiser la connexion à la base de données avec Knex
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './database.sqlite'
  },
  useNullAsDefault: true
});

// Initialisation de la table "users" si elle n'existe pas
db.schema.hasTable('users').then(async (exists) => {
  if (!exists) {
    await db.schema.createTable('users', table => {
      table.increments('id').primary();
      table.string('email').unique();
      table.string('hashedPassword');
      table.string('role'); 
    });

    // Créer un administrateur par défaut
    const defaultAdmin = {
      email: 'admin@site.com',
      hashedPassword: await bcryptjs.hash('admin123', 10), // Mot de passe par défaut haché
      role: 'admin'
    };

    const adminExists = await db('users').where({ email: defaultAdmin.email }).first();
    if (!adminExists) {
      await db('users').insert(defaultAdmin);
      console.log('Admin par défaut créé avec email: admin@site.com et password: admin123');
    }
  }
});


// Initialisation de la table "tickets" si elle n'existe pas
db.schema.hasTable('tickets').then(exists => {
  if (!exists) {
    return db.schema.createTable('tickets', table => {
      table.increments('id').primary();
      table.string('title');
      table.string('description');
      table.string('status'); 
      table.integer('userId').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('technicianId').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('createdAt').defaultTo(db.fn.now());
      table.timestamp('closedAt').nullable();
    });
  }
});

module.exports = db;