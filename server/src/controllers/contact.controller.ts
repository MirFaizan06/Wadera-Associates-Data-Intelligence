import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendContactAutoReply } from '../utils/email';
import xss from 'xss';

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(2000),
});

export const contactController = {
  submit: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = contactSchema.parse(req.body);

      // Sanitize message
      const sanitizedMessage = xss(data.message);

      const contact = await prisma.contactMessage.create({
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: sanitizedMessage,
          ipAddress: req.ip,
        },
      });

      await sendContactAutoReply(data.email, data.name, sanitizedMessage).catch(() => {});

      res.status(201).json({ success: true, data: { message: 'Message received. We will reply shortly.', id: contact.id } });
    } catch (err) { next(err); }
  },
};
