import express from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// GET all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHECKOUT / VALIDATE STOCK
router.post('/check-and-update', async (req, res) => {
  try {
    const { ticketId, quoi, combien } = req.body;

    if (!quoi || !Number.isInteger(combien) || combien < 1) {
      return res.status(400).json({
        ok: false,
        message: 'quoi and combien are required'
      });
    }

    const activeTickets = await Ticket.find({
      dateOutput: null,
      lanaGarde: false
    }).sort({ dateInput: 1 });

    const available = activeTickets.reduce((sum, t) => sum + (t.combien || 0), 0);

    if (available < combien) {
      return res.status(409).json({
        ok: false,
        message: 'Not enough available stock',
        available,
        requested: combien
      });
    }

    const ticketsToUse = activeTickets.slice(0, combien);

    for (const ticket of ticketsToUse) {
      await Ticket.findByIdAndUpdate(ticket._id, {
        dateOutput: new Date(),
        quoi,
        combien: ticket.combien
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Checkout successful',
      available,
      requested: combien
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

// POST create a new ticket (quoi is optional, defaults to null)
router.post('/', async (req, res) => {
  const { dateInput, dateOutput, qui, combien, lanaGarde } = req.body;
  const quoi = req.body.quoi && req.body.quoi.trim() !== '' ? req.body.quoi.trim() : null;

  try {
    const newTicket = new Ticket({
      dateInput,
      dateOutput,
      qui,
      quoi,
      combien,
      lanaGarde,
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update a ticket by ID
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Ticket ID format' });
    }

    const updateData = { ...req.body };

    if (updateData.quoi === '') {
      updateData.quoi = null;
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a ticket
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Ticket ID format' });
    }

    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);

    if (!deletedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;