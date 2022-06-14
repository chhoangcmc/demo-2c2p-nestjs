import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  async getPaymentToken(payload) {
    const merchantGeneratedJwtToken = await this.encodePaymentPayloadForToken(
      payload,
    );

    return this.httpService.post(
      'https://sandbox-pgw.2c2p.com/payment/4.1/PaymentToken',
      {
        payload: merchantGeneratedJwtToken,
      },
    );
  }

  encodePaymentPayloadForToken(payload: any) {
    return this.jwtService.signAsync(payload);
  }

  decodePaymentToken(paymentToken: string): any {
    return this.jwtService.decode(paymentToken);
  }

  async doPayment(payload: any) {
    return this.httpService.post(
      'https://sandbox-pgw.2c2p.com/payment/4.1/Payment',
      payload,
    );
  }

  // Because it is local development, we can't trigger a webhook (For 2c2p, it is called as backendReturnUrl)
  // to make our system be notifed about completec payment. So we will check manullay by using this method.
  async getPaymentInquiry(payload: any) {
    return this.httpService.post(
      'https://sandbox-pgw.2c2p.com/payment/4.1/PaymentInquiry',
      payload,
    );
  }
}
