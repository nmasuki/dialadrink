/**
 * Created by nmasuki on 11/4/2019.
 */
const Mpesa = require('mpesa-node');

class MPESAClient extends Mpesa{
    constructor() {
        super({
            environment: process.env.NODE_ENV != "production"? "sandbox": "production",
            consumerKey: process.env.MPESA_KEY,
            consumerSecret: process.env.MPESA_SECRET,
            shortCode: process.env.MPESA_SHOTCODE,
            initiatorName: process.env.MPESA_InitiatorName,
            lipaNaMpesaShortCode: process.env.LNM_Shortcode,
            lipaNaMpesaShortPass: process.env.LNM_PassKey,
            securityCredential: config.SecurityCredential,
            //certPath: path.resolve('keys/myKey.cert')
        });
    }

    getConfig(){
        return config;
    }
}