import { Router } from 'express';
import { PlaceController } from '../../controllers/place.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { CreatePlaceSchema, UpdatePlaceSchema } from '../../../application/dtos/place.dto';

export function createPlaceRouter(controller: PlaceController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/places:
   *   get:
   *     tags: [Places]
   *     summary: List all places
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 20 }
   *     responses:
   *       200:
   *         description: Paginated list of places
   */
  router.get('/', controller.getAll);

  /**
   * @openapi
   * /api/places/{id}:
   *   get:
   *     tags: [Places]
   *     summary: Get a place by ID
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Place found
   *       404:
   *         description: Place not found
   */
  router.get('/:id', controller.getById);

  /**
   * @openapi
   * /api/places:
   *   post:
   *     tags: [Places]
   *     summary: Create a new place
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, latitude, longitude]
   *             properties:
   *               name: { type: string }
   *               latitude: { type: number }
   *               longitude: { type: number }
   *               timezone: { type: string, example: "America/Panama" }
   *     responses:
   *       201:
   *         description: Place created
   *       422:
   *         description: Validation error
   */
  router.post('/', validateBody(CreatePlaceSchema), controller.create);

  /**
   * @openapi
   * /api/places/{id}:
   *   patch:
   *     tags: [Places]
   *     summary: Update a place
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               latitude: { type: number }
   *               longitude: { type: number }
   *               timezone: { type: string }
   *     responses:
   *       200:
   *         description: Place updated
   *       404:
   *         description: Place not found
   */
  router.patch('/:id', validateBody(UpdatePlaceSchema), controller.update);

  /**
   * @openapi
   * /api/places/{id}:
   *   delete:
   *     tags: [Places]
   *     summary: Delete a place
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Place deleted
   *       404:
   *         description: Place not found
   */
  router.delete('/:id', controller.delete);

  return router;
}
