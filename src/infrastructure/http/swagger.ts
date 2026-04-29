import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coworking Reservation API',
      version: '0.1.0',
      description: 'Workspace Reservation Management System — Backend API with IoT integration',
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
    tags: [
      { name: 'Places', description: 'Manage physical locations (sites)' },
      { name: 'Spaces', description: 'Manage rentable workspace units (offices)' },
      { name: 'Reservations', description: 'Manage client reservations' },
      { name: 'IoT', description: 'Device telemetry, digital twin, and alerts' },
    ],
  },
  apis: ['./src/infrastructure/http/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
