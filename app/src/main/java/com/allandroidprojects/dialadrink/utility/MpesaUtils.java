package com.allandroidprojects.dialadrink.utility;

import android.util.Base64;

import com.allandroidprojects.dialadrink.App;
import com.allandroidprojects.dialadrink.R;
import com.allandroidprojects.dialadrink.log.LogManager;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PublicKey;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import java.lang.reflect.Type;
import java.util.Map;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by nmasuki on 4/18/2018.
 */

public class MpesaUtils {
    private static final OkHttpClient httpClient = new OkHttpClient();
    private static final Gson gson = new Gson();

    private static final String MPESA_URL = App.getAppContext().getString(R.string.mpesa_url);
    private static final String RESULT_URL = App.getAppContext().getString(R.string.mpesa_result_url);
    private static final String CONFIRMATION_URL = App.getAppContext().getString(R.string.mpesa_result_url);
    private static final String TIMEOUT_URL = App.getAppContext().getString(R.string.mpesa_timeout_url);
    private static final String VALIDATION_URL = App.getAppContext().getString(R.string.mpesa_validation_url);
    private String ACCESS_TOKEN;

    public MpesaUtils(String app_key, String app_secret) {
        authenticate(app_key, app_secret);
    }

    private MpesaUtils() {
        this(App.getAppContext().getString(R.string.mpesa_app_key), App.getAppContext().getString(R.string.mpesa_app_key));
    }

    public static MpesaUtils getInstance() {
        return new MpesaUtils();
    }

    private void authenticate(String app_key, String app_secret) {
        try {
            // Use base64 to encode the consumer key and secret.
            byte[] bytes = (app_key + ":" + app_secret).getBytes("ISO-8859-1");
            String auth = Base64.encodeToString(bytes, Base64.NO_WRAP);

            Request request = new Request.Builder()
                    .url(MPESA_URL + "/oauth/v1/generate?grant_type=client_credentials")
                    .get()
                    .addHeader("authorization", "Basic " + auth)
                    .addHeader("cache-control", "no-cache")
                    .build();

            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    LogManager.getLogger().d(App.TAG, "Error while making http call to get access_token.", e);
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        LogManager.getLogger().d(App.TAG, response.body().charStream().toString());
                        Type type = new TypeToken<Map<String, Object>>() {
                        }.getType();
                        Map<String, Object> token = gson.fromJson(response.body().charStream(), type);
                        ACCESS_TOKEN = token.get("access_token").toString();

                        //Register for C2B
                        String shortCode = App.getAppContext().getString(R.string.mpesa_shortcode);
                        registerUrlC2B(shortCode, "TIMEOUT");
                    }
                }
            });
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }

    public void registerUrlC2B(String shortCode, String responseType) {
        RequestBody body = new FormBody.Builder()
                .add("ShortCode", shortCode)
                .add("ResponseType", responseType)
                .add("ConfirmationURL", CONFIRMATION_URL)
                .add("ValidationURL", VALIDATION_URL)
                .build();

        Request request = new Request.Builder()
                .url(MPESA_URL + "/mpesa/c2b/v1/registerurl")
                .post(body)
                .addHeader("authorization", "Bearer " + ACCESS_TOKEN)
                .addHeader("content-type", "application/json")
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {

            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    LogManager.getLogger().d(App.TAG, response.body().charStream().toString());
                    Type type = new TypeToken<Map<String, Object>>() {
                    }.getType();
                    Map<String, Object> map = gson.fromJson(response.body().charStream(), type);

                }
            }
        });
    }

    /**
     * Function to encrypt the initiator credentials
     *
     * @param securityCertificate
     * @param password
     * @return
     */
    public static String encryptInitiatorPassword(String securityCertificate, String password) {
        String encryptedPassword = "YOUR_INITIATOR_PASSWORD";
        try {
            //Security.addProvider(new org.bouncycastle.jce.provider.BouncyCastleProvider());
            byte[] input = password.getBytes();

            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding", "BC");
            FileInputStream fin = new FileInputStream(new File(securityCertificate));
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate certificate = (X509Certificate) cf.generateCertificate(fin);
            PublicKey pk = certificate.getPublicKey();
            cipher.init(Cipher.ENCRYPT_MODE, pk);

            byte[] cipherText = cipher.doFinal(input);

            // Convert the resulting encrypted byte array into a string using base64 encoding
            encryptedPassword = Base64.encodeToString(cipherText, Base64.NO_WRAP);

        } catch (NoSuchAlgorithmException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (NoSuchProviderException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (NoSuchPaddingException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (FileNotFoundException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (CertificateException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (InvalidKeyException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (IllegalBlockSizeException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        } catch (BadPaddingException ex) {
            LogManager.getLogger().d(App.TAG, null, ex);
        }

        return encryptedPassword;
    }

    public void b2b(String initiator, String securityCredential,
                    String commandID, String senderIdentifierType,
                    String recieverIdentifierType, Double amount,
                    String partyA, String partyB,
                    String accountReference, String remarks) {

        RequestBody body = new FormBody.Builder()
                .add("Initiator", initiator)
                .add("SecurityCredential", securityCredential)
                .add("CommandID", commandID)
                .add("SenderIdentifierType", senderIdentifierType)
                .add("RecieverIdentifierType", recieverIdentifierType)
                .add("Amount", String.valueOf(amount))
                .add("PartyA", partyA)
                .add("PartyB", partyB)
                .add("AccountReference", accountReference)
                .add("Remarks", remarks)
                .add("QueueTimeOutURL", TIMEOUT_URL)
                .add("ResultURL", RESULT_URL)
                .build();

        Request request = new Request.Builder()
                .url(MPESA_URL + "/mpesa/b2b/v1/paymentrequest")
                .post(body)
                .addHeader("authorization", "Bearer " + ACCESS_TOKEN)
                .addHeader("content-type", "application/json")
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {

            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {

            }
        });
    }
    public void c2B(String mobileNumber, Double amount){
        c2B(mobileNumber, amount, App.getAppContext().getString(R.string.mpesa_default_account));
    }

    public void c2B(String mobileNumber, Double amount, String billRefNumber) {
        if(billRefNumber == null || billRefNumber.isEmpty())
            billRefNumber = App.getAppContext().getString(R.string.mpesa_default_account);

        RequestBody body = new FormBody.Builder()
                .add("CommandID", "CustomerPayBillOnline")
                .add("Amount", String.valueOf(amount))
                .add("MSISDN", mobileNumber)
                .add("BillRefNumber", billRefNumber)
                .add("ShortCode", App.getAppContext().getString(R.string.mpesa_shortcode))
                .build();

        Request request = new Request.Builder()
                .url(MPESA_URL + "/mpesa/c2b/v1/simulate")
                .post(body)
                .addHeader("authorization", "Bearer " + ACCESS_TOKEN)
                .addHeader("content-type", "application/json")
                .build();

        httpClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {

            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (response.isSuccessful()) {
                    LogManager.getLogger().d(App.TAG, response.body().charStream().toString());
                    Type type = new TypeToken<Map<String, Object>>() {
                    }.getType();
                    Map<String, Object> map = gson.fromJson(response.body().charStream(), type);

                }
            }
        });
    }

}
