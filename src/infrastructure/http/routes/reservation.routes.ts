import { Router } from 'express';
import { ReservationController } from '../../controllers/reservation.controller';
import { validateBody } from '../middlewares/validate.middleware';
import {
  CreateReservationSchema,
  UpdateReservationSchema,
} from '../../../application/dtos/reservation.dto';

export function createReservationRouter(controller: ReservationController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/reservations:
   *   get:
   *     tags: [Reservations]
   *     summary: List all reservations (paginated)
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: spaceId
   *         schema: { type: string }
   *       - in: query
   *         name: placeId
   *         schema: { type: string }
   *       - in: query
   *         name: clientEmail
   *         schema: { type: string }
   *       - in: query
   *         name: date
   *         schema: { type: string, example: "2025-12-01" }
   *     responses:
   *       200:
   *         description: Paginated list of reservations
   */
  router.get('/', controller.getAll);

  /**
   * @openapi
   * /api/reservations/{id}:
   *   get:
   *     tags: [Reservations]
   *     summary: Get a reservation by ID
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Reservation found
   *       404:
   *         description: Reservation not found
   */
  router.get('/:id', controller.getById);

  /**
   * @openapi
   * /api/reservations:
   *   post:
   *     tags: [Reservations]
   *     summary: Create a new reservation
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [spaceId, clientEmail, reservationDate, startTime, endTime]
   *             properties:
   *               spaceId: { type: string }
   *               clientEmail: { type: string, format: email }
   *               reservationDate: { type: string, example: "2025-12-01" }
   *               startTime: { type: string, example: "09:00" }
   *               endTime: { type: string, example: "11:00" }
   *     responses:
   *       201:
   *         description: Reservation created
   *       409:
   *         description: Schedule conflict or weekly limit exceeded
   *       422:
   *         description: Validation error
   */
  router.post('/', validateBody(CreateReservationSchema), controller.create);

  /**
   * @openapi
   * /api/reservations/{id}:
   *   patch:
   *     tags: [Reservations]
   *     summary: Update a reservation
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Reservation updated
   *       409:
   *         description: Schedule conflict
   *       404:
   *         description: Reservation not found
   */
  router.patch('/:id', validateBody(UpdateReservationSchema), controller.update);

  /**
   * @openapi
   * /api/reservations/{id}:
   *   delete:
   *     tags: [Reservations]
   *     summary: Delete a reservation
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Reservation deleted
   *       404:
   *         description: Reservation not found
   */
  router.delete('/:id', controller.delete);

  return router;
}
