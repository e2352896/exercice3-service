const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Importer la connexion à la base de données
const app = express();
const { validationResult } = require('express-validator');
const ticketValidationRules = require('./validators/ticketValidator');

const PORT = 3000;
const SECRET_KEY = 'ma-cle-tres-secrete';

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour vérifier si l'utilisateur est un administrateur
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: 'Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action.' });
    }
    req.admin = decoded; // Ajouter les informations de l'admin à la requête
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide.' });
  }
}

// middleware pour vérifier si c'est un utilisateur ou un technicien
function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: 'Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'utilisateur' && decoded.role !== 'technicien') {
      return res.status(403).json({ message: 'Accès refusé. Seuls les utilisateurs ou techniciens peuvent effectuer cette action.' });
    }
    req.user = decoded; // Ajouter les informations de l'admin à la requête
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide.' });
  }
}

// middleware pour vérifier si c'est un technicien seulement
function authenticateTechnician(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'technicien') {
      return res.status(403).json({ message: 'Accès refusé. Seuls les techniciens peuvent effectuer cette action.' });
    }
    req.technician = decoded; // Ajouter les informations du technicien à la requête
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide.' });
  }
}


// route pour connecter un administrateur
app.post('/api/auth/admin', async (req, res) => {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const { email, password } = req.body;

    // Vérifiez si l'email appartient à un administrateur
    const admin = await db('users').where({ email, role: 'admin' }).first();
    if (!admin) {
      return res.status(404).json({ message: 'Admin non trouvé.' });
    }

    // Vérifiez si le mot de passe est correct
    const isPasswordValid = await bcryptjs.compare(password, admin.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    // génère le jeton
    const token = jwt.sign({ id: admin.id, role: admin.role }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Admin connecté avec succès.',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la connection de l\'admin.' });
  }
});

// Route pour créer un nouvel utilisateur ou technicien
app.post('/api/auth/new', authenticateAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Vérifier que tous les champs requis sont fournis
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password et role sont requis.' });
    }

    // Vérifier que le rôle est valide
    if (!['utilisateur', 'technicien'].includes(role)) {
      return res.status(400).json({ message: 'Le rôle doit être "user" ou "technician".' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insérer le nouvel utilisateur ou technicien dans la base de données
    await db('users').insert({
      email,
      hashedPassword,
      role,
    });

    res.status(201).json({ message: `Nouvel ${role} créé avec succès.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la création de l\'utilisateur.' });
  }
});


// route pour connecter un utilisateur ou un technicien
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }
  
  try {
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    } else if (user.role !== 'utilisateur' && user.role !== 'technicien') {
      return res.status(403).json({ message: 'Accès refusé. Seuls les utilisateurs et techniciens peuvent se connecter.' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({
      message: 'Utilisateur connecté avec succès.',
      token,
    });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la connexion de l\'utilisateur.' });
  }
});

// route pour créer un nouveau ticket par un utilisateur ou un technicien
app.post('/api/tickets', ticketValidationRules, authenticateUser , async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, status, createdAt } = req.body;
  const userId = req.user.id; // ID de l'utilisateur connecté

  try {
    await db('tickets').insert({
      title,
      description,
      status: 'open', // Statut par défaut
      createdAt,
      userId,
    });
    res.status(201).json({ message: 'Ticket créé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la création du ticket.' });
  }
});

// route pour obtenir la liste de tous les tickets
app.get('/api/tickets', authenticateUser, async (req, res) => {
  try {
    if(req.user.role === 'utilisateur') {
      const userId = req.user.id; // ID de l'utilisateur connecté
      const tickets = await db('tickets').where({ userId }).select('*');
      return res.status(200).json(tickets);
    } else if(req.user.role === 'technicien') {
      const tickets = await db('tickets').select('*');
      return res.status(200).json(tickets);
    } else {
      return res.status(403).json({ message: 'Accès refusé. Seuls les utilisateurs et techniciens peuvent voir les tickets.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la récupération des tickets.' });
  }
})


// route pour obtenir les détails d'un ticket spécifique
app.get('/api/tickets/:id', async (req, res) => {
  const ticketId = req.params.id;
  try {
    const ticket = await db('tickets').where({ id: ticketId }).first();
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé.' });
    }
    res.status(200).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la récupération du ticket.' });
  }
}
);


// route pour mettre à jour un ticket par un technicien
app.put('/api/tickets/:id', authenticateTechnician, async (req, res) => {
  const ticketId = req.params.id;
  const { title, description, status } = req.body;
  try {
    const ticket = await db('tickets').where({ id: ticketId }).first();
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé.' });
    }

    await db('tickets').where({ id: ticketId }).update({
      title,
      description,
      status,
      technicianId: req.technician.id, // ID du technicien connecté
    });
    res.status(200).json({ message: 'Ticket mis à jour avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la mise à jour du ticket.' });
  }
});


// route pour supprimer un ticket
app.delete('/api/admin/tickets/:id', authenticateAdmin, async (req, res) => {
  const ticketId = req.params.id;
  try {
    const ticket = await db('tickets').where({ id: ticketId }).first();
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé.' });
    }

    await db('tickets').where({ id: ticketId }).del();
    res.status(200).json({ message: 'Ticket supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la suppression du ticket.' });
  }
}
);


// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});