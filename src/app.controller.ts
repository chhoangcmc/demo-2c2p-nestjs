import { Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  private merchantId = 'JT01';

  // Server-to-Server Flow Sequence Diagram. Refer: https://developer.2c2p.com/docs/direct-api-flow-server-to-server
  @Post('do-payment')
  async doPayment() {
    //  2. Merchant is required to request a payment token from 2C2P.
    const getPaymentTokenObs = await this.appService.getPaymentToken({
      merchantID: this.merchantId,
      invoiceNo: Math.random() * 10000000,
      description: 'item 1',
      amount: 1299.0,
      currencyCode: 'SGD',
      paymentChannel: ['CC'],
      request3DS: 'N',
    });

    getPaymentTokenObs.subscribe((res) => {
      console.log('payment token', res.data);

      // 3. 2C2P returns the payment token to the merchant.
      const decodedPayload = this.appService.decodePaymentToken(
        res.data.payload,
      );

      console.log('decoded payment toekn', decodedPayload);

      const paymentToken = decodedPayload.paymentToken;

      // 9. Customer select payment options and submit payment
      // 10. Merchant requests payment with payment token and payment information.
      const doPaymentObs = this.appService.doPayment({
        paymentToken,
        locale: 'en',
        payment: {
          code: {
            channelCode: 'CC',
          },
          data: {
            name: 'DavidBilly',
            email: 'davidbilly@2c2p.com',
            mobileNo: '0888888888',
            cardNo: 4111111111111111,
            securityCode: 123,
            expiryMonth: 12,
            expiryYear: 2022,
          },
        },
      });

      doPaymentObs.then((obs) => {
        obs.subscribe(({ data }) => {
          // 11. 2C2P returns payment response to merchant.
          const invoiceNo = data.invoiceNo;

          console.log('do payment response', data);

          this.appService
            .encodePaymentPayloadForToken({
              paymentToken,
              merchantID: this.merchantId,
              invoiceNo,
              locale: 'en',
            })
            .then((jwtToken) => {
              this.appService
                .getPaymentInquiry({
                  payload: jwtToken,
                })
                .then((obs) => {
                  obs.subscribe(({ data }) => {
                    //  13. Merchant is required to request a payment inquiry. This is not required if merchant has enabled backend response (enabled backend response === specify backendReturnUrl in payment token request).
                    const decodedInquiry = this.appService.decodePaymentToken(
                      data.payload,
                    );

                    // https://developer.2c2p.com/docs/response-code-payment
                    console.log('paymend inquiry response', data);

                    console.log('decoded payment inquiry', decodedInquiry);
                  });
                });
            });
        });
      });
    });
  }

  @Post('recurring-payment')
  async recurringPayment() {
    //  2. Merchant is required to request a payment token from 2C2P.
    const getPaymentTokenObs = await this.appService.getPaymentToken({
      merchantID: this.merchantId,
      invoiceNo: Math.random() * 10000000,
      description: 'item 1',
      amount: 1299.05,
      currencyCode: 'SGD',
      paymentChannel: ['CC'],
      recurring: true,
      invoicePrefix: Math.random() * 10000000,
      maxAccumulateAmount: '',
      recurringInterval: '30',
      recurringCount: '12',
      chargeNextDate: '15062022',
      allowAccumulate: false,
    });

    getPaymentTokenObs.subscribe((res) => {
      console.log('payment token', res.data);

      // 3. 2C2P returns the payment token to the merchant.
      const decodedPayload = this.appService.decodePaymentToken(
        res.data.payload,
      );

      console.log('decoded payment toekn', decodedPayload);

      const { paymentToken } = decodedPayload;

      // 9. Customer select payment options and submit payment
      // 10. Merchant requests payment with payment token and payment information.
      const doPaymentObs = this.appService.doPayment({
        responseReturnUrl:
          'https://sandbox-pgw-ui.2c2p.com/payment/4.1/#/info/',
        payment: {
          code: {
            channelCode: 'CC',
          },
          data: {
            name: 'DavidBilly',
            email: 'davidbilly@2c2p.com',
            mobileNo: '0888888888',
            cardNo: 4111111111111111,
            securityCode: 123,
            expiryMonth: 12,
            expiryYear: 2022,
          },
        },
        paymentToken,
        locale: 'en',
      });

      doPaymentObs.then((obs) => {
        obs.subscribe(({ data }) => {
          // 11. 2C2P returns payment response to merchant.
          const invoiceNo = data.invoiceNo;

          console.log('do payment response', data);

          this.appService
            .encodePaymentPayloadForToken({
              paymentToken,
              merchantID: this.merchantId,
              invoiceNo,
              locale: 'en',
            })
            .then((jwtToken) => {
              setTimeout(() => {
                this.appService
                  .getPaymentInquiry({
                    payload: jwtToken,
                  })
                  .then((obs) => {
                    obs.subscribe(({ data }) => {
                      //  13. Merchant is required to request a payment inquiry. This is not required if merchant has enabled backend response (enabled backend response === specify backendReturnUrl in payment token request).
                      const decodedInquiry = this.appService.decodePaymentToken(
                        data.payload,
                      );

                      // https://developer.2c2p.com/docs/response-code-payment
                      console.log('paymend inquiry response', data);

                      console.log('decoded payment inquiry', decodedInquiry);
                    });
                  });
              }, 60000);
            });
        });
      });
    });
  }

  @Post('test-card-token')
  async testCardToken() {
    //  2. Merchant is required to request a payment token from 2C2P.
    const getPaymentTokenObs = await this.appService.getPaymentToken({
      merchantID: this.merchantId,
      invoiceNo: Math.random() * 10000000,
      description: 'item 1',
      amount: 1299.0,
      currencyCode: 'SGD',
      paymentChannel: ['CC'],
      request3DS: 'N',
      cardTokens: ['20052010380915759367'], // Including cardTokens, the customer don't need to provide card info again
    });

    getPaymentTokenObs.subscribe((res) => {
      console.log('payment token', res.data);

      // 3. 2C2P returns the payment token to the merchant.
      const decodedPayload = this.appService.decodePaymentToken(
        res.data.payload,
      );

      console.log('decoded payment toekn', decodedPayload);

      const { paymentToken } = decodedPayload;

      // 9. Customer select payment options and submit payment
      // 10. Merchant requests payment with payment token and payment information.
      const doPaymentObs = this.appService.doPayment({
        responseReturnUrl:
          'https://sandbox-pgw-ui.2c2p.com/payment/4.1/#/info/',
        payment: {
          code: {
            channelCode: 'CC',
          },
          data: {
            name: 'DavidBilly',
            cardTokenize: false,
            token: '20052010380915759367', // Match the cardTokens provide above
          },
        },
        paymentToken,
        locale: 'en',
      });

      doPaymentObs.then((obs) => {
        obs.subscribe(({ data }) => {
          // 11. 2C2P returns payment response to merchant.
          const invoiceNo = data.invoiceNo;

          console.log('do payment response', data);

          this.appService
            .encodePaymentPayloadForToken({
              paymentToken,
              merchantID: this.merchantId,
              invoiceNo,
              locale: 'en',
            })
            .then((jwtToken) => {
              setTimeout(() => {
                this.appService
                  .getPaymentInquiry({
                    payload: jwtToken,
                  })
                  .then((obs) => {
                    obs.subscribe(({ data }) => {
                      //  13. Merchant is required to request a payment inquiry. This is not required if merchant has enabled backend response (enabled backend response === specify backendReturnUrl in payment token request).
                      const decodedInquiry = this.appService.decodePaymentToken(
                        data.payload,
                      );

                      // https://developer.2c2p.com/docs/response-code-payment
                      console.log('paymend inquiry response', data);

                      console.log('decoded payment inquiry', decodedInquiry);
                    });
                  });
              }, 1000);
            });
        });
      });
    });
  }
}
