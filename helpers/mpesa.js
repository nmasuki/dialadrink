/**
 * Created by nmasuki on 11/4/2019.
 */
const Mpesa = require('mpesa-node');
const URL = 'https://www.pharmacydelivery.co.ke/mpesa';

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
            //securityCredential: process.env.MPESA_SecurityCredential,
            //certPath: path.resolve('keys/myKey.cert')
        });

        this.c2bRegister(URL + '/c2b/validation', URL + '/c2b/success');
    }

    getConfig(){
        return configs;
    }

    onlineCheckout(mobileNumber, amount, accountRef){
        this.lipaNaMpesaOnline(mobileNumber, amount, URL + '/lipanampesa/success', accountRef);
    }
}

module.exports = new MPESAClient();