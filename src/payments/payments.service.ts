import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET'),
    );
  }

  async createCheckoutSession(
    dto: CreatePaymentSessionDto,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL'),
      cancel_url: this.configService.getOrThrow<string>('STRIPE_CANCEL_URL'),
      payment_intent_data: {
        metadata: {
          orderId: dto.orderId,
        },
      },
      line_items: dto.items.map((item) => ({
        price_data: {
          currency: dto.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.getOrThrow<string>('STRIPE_ENDPOINT_SECRET'),
      );
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${(error as Error).message}`,
      );
      throw new BadRequestException('Invalid Stripe signature');
    }

    switch (event.type) {
      case 'charge.succeeded': {
        const orderId = (event.data.object as Stripe.Charge).metadata.orderId;
        this.logger.log(`Payment succeeded for order ${orderId ?? 'unknown'}`);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }
}
