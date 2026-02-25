import crypto from 'crypto';
import https from 'https';

export interface MomoPaymentConfig {
    partnerCode: string;
    accessKey: string;
    secretKey: string;
    apiUrl: string;
    redirectUrl: string;
    ipnUrl: string;
}

export interface MomoPaymentRequest {
    amount: string;
    orderId: string;
    orderInfo: string;
    requestId: string;
    extraData?: string;
}

export class MomoService {
    private config: MomoPaymentConfig;

    constructor(config: MomoPaymentConfig) {
        this.config = config;
    }

    createPayment(request: MomoPaymentRequest): Promise<any> {
        const { amount, orderId, orderInfo, requestId, extraData = '' } = request;
        const { partnerCode, accessKey, secretKey, apiUrl, redirectUrl, ipnUrl } = this.config;
        const requestType = "payWithMethod";
        const lang = 'vi';
        const autoCapture = true;

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            partnerName: "Travel Manager Pro",
            storeId: "TravelManagerStore",
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang,
            requestType,
            autoCapture,
            extraData,
            signature
        });

        const url = new URL(apiUrl);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (e) {
                        reject(new Error('Lỗi giải mã phản hồi từ Momo'));
                    }
                });
            });

            req.on('error', (e) => {
                reject(e);
            });

            req.write(requestBody);
            req.end();
        });
    }

    verifySignature(params: any): boolean {
        const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = params;
        const { secretKey, accessKey } = this.config;

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const generatedSignature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        return generatedSignature === signature;
    }
}
