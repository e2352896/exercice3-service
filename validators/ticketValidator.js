const { body } = require('express-validator');
const db = require('../db');

const ticketValidationRules = [
  body('title')
    .isString().withMessage('Titre doit être une chaîne de caractère.')
    .notEmpty().withMessage('Titre ne doit pas être vide.'),
  body('description')
    .isString().withMessage('Description doit être une chaîne de caractère.')
    .notEmpty().withMessage('Description ne doit pas être vide.'),
  body('status')
    .isIn(['open', 'in progress', 'closed']).withMessage('Status doit être l\'un des suivants: open, in progress, closed.'),
  body('userId')
    .optional({ nullable: true })
    .isInt({ gt: 0 }).withMessage('User ID doit être un entier positif.')
    .custom(async (value) => {
      const userExists = await db('users').where({ id: value }).first();
      if (!userExists) {
        throw new Error('User ID n\'existe pas.');
      }
      return true;
    }),
  body('technicianId')
    .optional({ nullable: true })
    .isInt({ gt: 0 }).withMessage('Technician ID doit être un entier positif.')
    .custom(async (value) => {
      if (value !== null) {
        const technicianExists = await db('users').where({ id: value }).first();
        if (!technicianExists) {
          throw new Error('Technician ID n\'existe pas.');
        }
      }
      return true;
    }),
  body('createdAt')
    .isISO8601().withMessage('CreatedAt doit être une date valide.'),
  body('closedAt')
    .optional({ nullable: true })
    .isISO8601().withMessage('ClosedAt doit être une date valide.')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.createdAt)) {
        throw new Error('ClosedAt doit être plus grand que createdAt.');
      }
      if (value && req.body.status !== 'closed') {
        throw new Error('Status doit être "closed" si ClosedAt est donné.');
      }
      return true;
    }),
];

module.exports = ticketValidationRules;