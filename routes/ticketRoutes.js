import express from 'express';
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

// POST create a new ticket
router.post('/', async (req, res) => {
  const { dateInput, dateOutput, qui, combien, lanaGarde } = req.body;
  const quoi = req.body.quoi === '' ? null : req.body.quoi;

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

// PUT update a ticket by ID (e.g., adding dateOutput or updating lanaGarde)
router.put('/:id', async (req, res) => {
  try {
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
    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);
    if (!deletedTicket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

    const firstTicket = activeTickets[0];

    if (!firstTicket) {
      return res.status(404).json({
        ok: false,
        message: 'No active ticket available'
      });
    }

    if (combien === available) {
      await Ticket.findByIdAndUpdate(firstTicket._id, {
        dateOutput: new Date(),
        quoi,
        combien
      });

      for (const ticket of activeTickets.slice(1)) {
        await Ticket.findByIdAndDelete(ticket._id);
      }

      return res.status(200).json({
        ok: true,
        message: 'Checkout successful'
      });
    }

    // if requested is smaller than total available:
    await Ticket.findByIdAndUpdate(firstTicket._id, {
      dateOutput: new Date(),
      quoi,
      combien
    });

    return res.status(200).json({
      ok: true,
      message: 'Checkout successful'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

export default router;