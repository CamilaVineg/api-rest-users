import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto.js';
import { PaymentsService } from './payments.service.js';

type RequestWithRawBody = Request & { rawBody?: Buffer };

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  createPaymentSession(
    @Body() dto: CreatePaymentSessionDto,
  ): Promise<Stripe.Checkout.Session> {
    return this.paymentsService.createCheckoutSession(dto);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful',
    };
  }

  @Get('cancel')
  cancel() {
    return {
      ok: false,
      message: 'Payment cancelled',
    };
  }
}
