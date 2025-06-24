// routes/funds.js - Fund Addition API Routes
const express = require('express');
const axios = require('axios');
const router = express.Router();
const dotenv = require('dotenv');
const Patient = require('../models/patientProfile'); 
const crypto = require('crypto'); // Add this for webhook verification
const { TransactionModel } = require('../models/transactionAndRefund'); // Adjust the import path as needed

dotenv.config();

// Import your existing payment configuration
const CHAPA_AUTH_KEY = "CHASECK_TEST-SZL3DthorQlMCC0X3l95fgnCpEz75TZj"
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

// Helper function to create Chapa headers (reuse from payments.js)
const getChapaHeaders = () => ({
  headers: {
    Authorization: `Bearer ${CHAPA_AUTH_KEY}`,
    "Content-Type": "application/json",
  },
});

// Initialize Fund Addition Payment
router.post('/wallet/add-funds/initialize', async (req, res) => {
  try {
    const {
      amount,
      currency = 'ETB',
      userId,
      userInfo
    } = req.body;

    // Validate required fields
    if (!amount || !userId || !userInfo?.email || !userInfo?.firstName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, userId, userInfo.email, userInfo.firstName'
      });
    }

    // Validate amount for telehealth wallet
    const fundAmount = parseFloat(amount);
    if (fundAmount <= 0 || fundAmount > 5000) { // Reasonable limits for telehealth
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $1 and $5,000 for telehealth wallet'
      });
    }

    // Generate unique transaction reference for telehealth wallet funding
    const txRef = `telehealth_wallet_${userId}_${Date.now()}`;
    
    const paymentData = {
      amount: fundAmount,
      currency,
      email: userInfo.email,
      first_name: userInfo.firstName,
      last_name: userInfo.lastName || '',
      phone_number: userInfo.phone || userInfo.phoneNumber || '0900000000',
      tx_ref: txRef,
     
      customization: {
        title: 'Add Funds',
        description: `Add ${fundAmount} birr to your telehealth wallet`,
        logo: process.env.COMPANY_LOGO_URL || ''
      },
      meta: {
        userId,
        type: 'telehealth-wallet-funding',
        originalAmount: fundAmount,
        patientId: userId, // For telehealth context
        purpose: 'wallet funding'
      }
    };

    console.log('Initializing telehealth wallet funding:', { 
      txRef, 
      amount: fundAmount, 
      userId,
      patientId: userId 
    });

    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      paymentData,
      getChapaHeaders()
    );

    if (response.data.status === 'success') {
      res.json({
        success: true,
        data: {
          checkoutUrl: response.data.data.checkout_url,
          txRef: txRef,
          publicKey: process.env.CHAPA_PUBLIC_KEY,
          amount: fundAmount,
          purpose: 'telehealth_wallet'
        }
      });
    } else {
      console.error('Chapa telehealth wallet funding initialization failed:', response.data);
      res.status(400).json({
        success: false,
        message: response.data.message || 'Telehealth wallet funding initialization failed',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Telehealth wallet funding initialization error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(400).json({
        success: false,
        message: error.response.data?.message || 'Telehealth wallet funding initialization failed',
        error: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during telehealth wallet funding initialization',
        error: error.message
      });
    }
  }
});

// Verify Fund Addition Payment
router.post('/wallet/add-funds/verify', async (req, res) => {
  try {
    const { txRef, userId } = req.body;

    if (!txRef) {
      return res.status(400).json({ success: false, message: 'txRef is required' });
    }

    console.log('Verifying telehealth wallet funding:', { txRef, userId });

    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      getChapaHeaders()
    );

    if (response.data.status === 'success') {
      const paymentData = response.data.data;

      if (paymentData.status === 'success') {
        const amount = parseFloat(paymentData.amount);
        const userIdFromMeta = paymentData.meta?.userId;

        // FIX: Corrected the meta type check
        if (paymentData.meta?.type !== 'telehealth-wallet-funding') {
          return res.status(400).json({
            success: false,
            message: 'Invalid transaction type for telehealth wallet'
          });
        }

        //  Added detailed try...catch for database operations
        try {
          console.log(`Attempting to find patient with ID: ${userIdFromMeta}`);
          const user = await Patient.getById(userIdFromMeta);
          if (!user) {
            console.error(`Patient not found with ID: ${userIdFromMeta}`);
            throw new Error('Patient not found');
          }
          console.log(`Patient found:`, user);

          console.log(`Attempting to update wallet for patient ${userIdFromMeta} with amount ${amount}`);
          const updatedPatient = await Patient.updateWalletBalance(userIdFromMeta, amount);
          console.log(`Wallet updated successfully for patient ${userIdFromMeta}`);
          TransactionModel.create({
            userId: userIdFromMeta,
            type: 'DEPOSIT',
            amount: amount,
            reason: 'Telehealth wallet funding',
            status: 'SUCCESS',
            relatedAppointmentId: null, // No appointment related to wallet funding
            chapaRef: txRef // Chapa transaction reference
          });
          res.json({
            success: true,
            data: {
              txRef: paymentData.tx_ref,
              amount: amount,
              currency: paymentData.currency,
              status: paymentData.status,
              newWalletBalance: updatedPatient.telehealthWalletBalance,
              purpose: 'telehealth_wallet',
              meta: paymentData.meta
            }
          });
        } catch (dbError) {
          console.error('Database update error for telehealth wallet:', dbError);
          res.status(500).json({
            success: false,
            message: 'Payment verified but failed to update wallet balance',
            error: dbError.message
          });
        }
      } else {
        res.status(400).json({
          success: false,
          message: `Telehealth wallet funding not successful. Status: ${paymentData.status}`,
          data: paymentData
        });
      }
    } else {
      console.error('Chapa telehealth wallet funding verification failed:', response.data);
      res.status(400).json({
        success: false,
        message: response.data.message || 'Telehealth wallet funding verification failed',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Telehealth wallet funding verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during telehealth wallet funding verification',
      error: error.message
    });
  }
});


// Fund Addition Callback (webhook from Chapa)
router.post('/callback', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['chapa-signature'];
    const payload = req.body;

    console.log('Fund addition callback received:', {
      signature,
      payload: payload.toString()
    });

    // Verify webhook signature if configured
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
    console.log('Fund addition callback data:', data);

    // Handle successful fund addition
    if (data.status === 'success' && data.meta?.type === 'fund_addition') {
      const { tx_ref, meta, amount, currency } = data;
      const userId = meta.userId;
      const fundAmount = parseFloat(amount);
      
      console.log(`Fund addition successful for user: ${userId}`);
      console.log(`Transaction ID: ${tx_ref}`);
      console.log(`Amount: ${fundAmount} ${currency}`);
      
    } else if (data.status === 'failed' && data.meta?.type === 'fund_addition') {
      console.log('Fund addition failed:', data);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Fund addition callback error:', error);
    res.status(500).json({ 
      message: 'Callback processing failed',
      error: error.message 
    });
  }
});

// Get Fund Addition Status
router.get('/add-funds/status/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;
    
    console.log('Checking fund addition status for:', txRef);
    
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      getChapaHeaders()
    );
    
    if (response.data.status === 'success') {
      res.json({
        success: true,
        data: response.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Fund addition status check failed',
        error: response.data
      });
    }
  } catch (error) {
    console.error('Fund addition status check error:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(400).json({
        success: false,
        message: error.response.data?.message || 'Fund addition status check failed',
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

// IMPORTANT: Export the router
module.exports = router;

