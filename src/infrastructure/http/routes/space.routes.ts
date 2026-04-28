import { Router } from "express";
import { SpaceController } from "../../controllers/space.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { CreateSpaceSchema, UpdateSpaceSchema } from "../../../application/dtos/space.dto";

export function createSpaceRouter(controller: SpaceController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/spaces:
   *   get:
   *     tags: [Spaces]
   *     summary: List all spaces
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
   *         description: Paginated list of spaces
   */
  router.get("/", controller.getAll);

  /**
   * @openapi
   * /api/spaces/{id}:
   *   get:
   *     tags: [Spaces]
   *     summary: Get a space by ID
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Space found
   *       404:
   *         description: Space not found
   */
  router.get("/:id", controller.getById);

  /**
   * @openapi
   * /api/spaces:
   *   post:
   *     tags: [Spaces]
   *     summary: Create a new space
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [placeId, name, capacity, opensAt, closesAt]
   *             properties:
   *               placeId: { type: string }
   *               name: { type: string }
   *               reference: { type: string }
   *               capacity: { type: integer }
   *               description: { type: string }
   *               opensAt: { type: string, example: "08:00" }
   *               closesAt: { type: string, example: "18:00" }
   *     responses:
   *       201:
   *         description: Space created
   *       404:
   *         description: Place not found
   *       422:
   *         description: Validation error
   */
  router.post("/", validateBody(CreateSpaceSchema), controller.create);

  /**
   * @openapi
   * /api/spaces/{id}:
   *   patch:
   *     tags: [Spaces]
   *     summary: Update a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Space updated
   *       404:
   *         description: Space not found
   */
  router.patch("/:id", validateBody(UpdateSpaceSchema), controller.update);

  /**
   * @openapi
   * /api/spaces/{id}:
   *   delete:
   *     tags: [Spaces]
   *     summary: Delete a space
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204:
   *         description: Space deleted
   *       404:
   *         description: Space not found
   */
  router.delete("/:id", controller.delete);

  return router;
}
