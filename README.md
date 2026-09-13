# api-rest-users

Microservicio HTTP (NestJS) para crear **sesiones de pago** con Stripe y recibir el aviso (**webhook**) cuando el cobro se concreta.

## Levantar el proyecto

```bash
npm install
```

Configurar las variables de entorno:

```bash
cp .env.template .env   # Windows: copy .env.template .env
```

Completar en `.env`:

| Variable                      | Uso                                          |
|-------------------------------|----------------------------------------------|
| `PORT`                        | Puerto HTTP (sugerido: `3003`)               |
| `STRIPE_SECRET`               | Clave secreta de test (`sk_test_...`)        |
| `STRIPE_ENDPOINT_SECRET`      | Signing secret del webhook (`whsec_...`)     |
| `STRIPE_SUCCESS_URL`          | p. ej. `http://localhost:3003/payments/success` |
| `STRIPE_CANCEL_URL`           | p. ej. `http://localhost:3003/payments/cancel`  |

Ejecutar en modo desarrollo:

```bash
npm run start:dev
```

## Rutas

### Entrega 1 — Crear sesión de pago

`POST /payments/create-payment-session`

```json
{
  "orderId": "ord-1",
  "currency": "usd",
  "items": [{ "name": "Producto", "price": 20, "quantity": 1 }]
}
```

Devuelve la Checkout Session creada en Stripe (incluye `id` y `url` para redirigir al checkout).

### Entrega 2 — Webhook de pago confirmado

`POST /payments/webhook` (header `stripe-signature`, cuerpo crudo)

Stripe avisa cuando el pago se concreta (`charge.succeeded`) y el MS loguea el `orderId`.

### Redirecciones del checkout

- `GET /payments/success` → `{ "ok": true, "message": "Payment successful" }`
- `GET /payments/cancel` → `{ "ok": false, "message": "Payment cancelled" }`

## Probar el webhook en local

Con la [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:3003/payments/webhook
```

Usar el `whsec_...` que imprime la CLI como `STRIPE_ENDPOINT_SECRET`, crear una sesión y pagar con una [tarjeta de prueba](https://docs.stripe.com/testing). El log `Payment succeeded for order <orderId>` confirma la entrega 2.