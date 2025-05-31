// routes/payments.js - Fixed Payment routes with direct Chapa API
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

// Chapa configuration
const CHAPA_AUTH_KEY = "CHASECK_TEST-SZL3DthorQlMCC0X3l95fgnCpEz75TZj"//process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

// Helper function to create Chapa headers
const getChapaHeaders = () => ({
  headers: {
    Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
    "Content-Type": "application/json",
  },
});

// Initialize Payment
router.post('/initialize', async (req, res) => {
  try {
    const {
      orderId,
      amount,
      currency = 'ETB',
      customerInfo,
      orderDetails
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !customerInfo?.email || !customerInfo?.firstName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, amount, customerInfo.email, customerInfo.firstName'
      });
    }

    // Generate unique transaction reference
    const txRef = `tx_${orderId}_${Date.now()}`;
    // console.log('orderDetails:', orderDetails);

    const paymentData = {
      amount: parseFloat(amount),
      currency,
      email: 'test@gmail.com',//customerInfo.email,
      first_name: customerInfo.firstName,
      last_name: customerInfo.lastName || '',
      phone_number: customerInfo.phone || '0900000000', // Use test phone for test mode
      tx_ref: txRef,
      // callback_url: `${process.env.BACKEND_URL}/api/payments/callback`,
      // return_url: `${process.env.FRONTEND_URL}/checkout/success?tx_ref=${txRef}`,
      customization: {
        title: `Order ${orderDetails.orderNumber} Payment`,
        description: `Payment for Order ${orderDetails.orderNumber} from ${orderDetails.sellerName}`,
        logo: process.env.COMPANY_LOGO_URL || ''
      },
      meta: {
        orderId,
        userId: req.user?.uid,
        sellerId: orderDetails.sellerId,
        orderNumber: orderDetails.orderNumber
      }
    };

    // console.error('Chapa initialization getChapaHeaders:', getChapaHeaders());
    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      paymentData,
      getChapaHeaders()
    );

    // console.log('Chapa initialization response:', response.data);

    if (response.data.status === 'success') {
          res.json({
        success: true,
        data: {
          checkoutUrl: response.data.data.checkout_url,
          txRef: txRef,
          publicKey: process.env.CHAPA_PUBLIC_KEY,
        }
      });
    } else {
      // console.error('Chapa initialization failed:', response.data);
      res.status(400).json({
        success: false,
        message: response.data.message || 'Payment initialization failed',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Payment initialization error:', error.response?.data || error.message);
    
    // Handle Chapa API errors
    if (error.response) {
      console.log('Chapa API Error Response:', error.response.data);
      console.log('Status Code:', error.response.status);
      
      res.status(400).json({
        success: false,
        message: error.response.data?.message || 'Payment initialization failed',
        error: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during payment initialization',
        error: error.message
      });
    }
  }
});

// Verify Payment
router.post('/verify', async (req, res) => {
  try {
    const { txRef, orderId } = req.body;

    if (!txRef) {
      return res.status(400).json({
        success: false,
        message: 'txRef is required'
      });
    }

    // console.log('Verifying payment:', { txRef, orderId });

    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      getChapaHeaders()
    );

    // console.log('Chapa verification response:', response.data);

    if (response.data.status === 'success') {
      const paymentData = response.data.data;
      
      // Check if payment was successful
      if (paymentData.status === 'success') {
        // Update payment status in database
        // await PaymentModel.updateOne(
        //   { txRef },
        //   { 
        //     status: 'COMPLETED',
        //     chapaResponse: paymentData,
        //     verifiedAt: new Date()
        //   }
        // );

        res.json({
          success: true,
          data: {
            txRef: paymentData.tx_ref,
            amount: paymentData.amount,
            currency: paymentData.currency,
            status: paymentData.status,
            reference: paymentData.reference,
            transactionId: paymentData.tx_ref,
            meta: paymentData.meta
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Payment not successful. Status: ${paymentData.status}`,
          data: paymentData
        });
      }
    } else {
      console.error('Chapa verification failed:', response.data);
      res.status(400).json({
        success: false,
        message: response.data.message || 'Payment verification failed',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(400).json({
        success: false,
        message: error.response.data?.message || 'Payment verification failed',
        error: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during payment verification',
        error: error.message
      });
    }
  }
});

// Payment Callback (webhook from Chapa)
router.post('/callback', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['chapa-signature'];
    const payload = req.body;

    // console.log('Payment callback received:', {
    //   signature,
    //   payload: payload.toString()
    // });

    // Verify webhook signature (recommended for production)
    if (process.env.CHAPA_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (signature !== `sha256=${expectedSignature}`) {
        console.log('Invalid webhook signature');
        return res.status(400).json({ message: 'Invalid signature' });
      }
    }

    const data = JSON.parse(payload.toString());
    console.log('Payment callback data:', data);

    // Handle successful payment
    if (data.status === 'success') {
      const { tx_ref, meta, amount, currency } = data;
      
      // Update order status in database
      if (meta?.orderId) {
        console.log(`Payment successful for order: ${meta.orderId}`);
        console.log(`Transaction ID: ${tx_ref}`);
        console.log(`Amount: ${amount} ${currency}`);
        
        // Update order status
        // await OrderModel.updateOne(
        //   { orderId: meta.orderId },
        //   { 
        //     status: 'PAID',
        //     paymentStatus: 'COMPLETED',
        //     transactionId: tx_ref,
        //     paidAt: new Date()
        //   }
        // );

        // Update payment record
        // await PaymentModel.updateOne(
        //   { txRef: tx_ref },
        //   { 
        //     status: 'COMPLETED',
        //     chapaResponse: data,
        //     verifiedAt: new Date()
        //   }
        // );

        // Send confirmation email, update inventory, etc.
        // await sendOrderConfirmationEmail(meta.orderId);
        // await updateInventory(meta.orderId);
      }
    } else if (data.status === 'failed') {
      console.log('Payment failed:', data);
      
      // Handle failed payment
      if (data.meta?.orderId) {
        // await OrderModel.updateOne(
        //   { orderId: data.meta.orderId },
        //   { 
        //     paymentStatus: 'FAILED',
        //     failureReason: data.message || 'Payment failed'
        //   }
        // );
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ 
      message: 'Callback processing failed',
      error: error.message 
    });
  }
});

// Get Payment Status
router.get('/status/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;
    
    console.log('Checking payment status for:', txRef);
    
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      getChapaHeaders()
    );
    
    // console.log('Payment status response:', response.data);
    
    if (response.data.status === 'success') {
      res.json({
        success: true,
        data: response.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment status check failed',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Payment status check error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(400).json({
        success: false,
        message: error.response.data?.message || 'Payment status check failed',
        error: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
});

// Test endpoint to check Chapa connection (for development)
router.get('/test-connection', async (req, res) => {
  try {
    // Test with a small amount
    const testData = {
      amount: 10,
      currency: 'ETB',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone_number: '0900000000',
      tx_ref: `test_${Date.now()}`,
      // callback_url: `${process.env.BACKEND_URL}/api/payments/callback`,
      // return_url: `${process.env.FRONTEND_URL}/test`
    };

    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      testData,
      getChapaHeaders()
    );
    
    res.json({
      success: true,
      message: 'Chapa connection successful',
      testMode: process.env.NODE_ENV !== 'production',
      response: response.data
    });
  } catch (error) {
    console.error('Chapa connection test failed:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(500).json({
        success: false,
        message: 'Chapa connection failed',
        error: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Chapa connection failed',
        error: error.message
      });
    }
  }
});

module.exports = router;