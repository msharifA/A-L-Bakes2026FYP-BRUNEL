import Stripe from "stripe";
import { pool } from "../db.js";
import { sendEmail } from "../services/email.service.js";
import { uploadEnquiryImage } from "../services/s3.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Size-based pricing (pence)
const SIZE_PRICES = {
  '6inch': 4500,
  '8inch': 5500,
  '10inch': 7000,
  '12inch': 8500,
  '2tier': 12000,
  '3tier': 18000,
};

// POST /api/enquiries - Submit a custom cake enquiry
export async function submitEnquiry(req, res) {
  try {
    const {
      customerName, customerEmail, customerPhone,
      cakeSize, cakeFlavour, filling, frosting,
      tiers, servings, messageOnCake, specialRequests,
      referenceImages, eventType, eventDate,
      deliveryAddressLine1, deliveryAddressLine2,
      deliveryCity, deliveryPostcode, deliveryNotes,
    } = req.body;

    if (!customerName || !customerEmail || !cakeSize || !cakeFlavour) {
      return res.status(400).json({ error: "Name, email, size and flavour are required" });
    }

    const estimatedPricePence = SIZE_PRICES[cakeSize] || 5000;
    const depositPence = Math.round(estimatedPricePence * 0.5);

    const refImagesJson = referenceImages?.length ? JSON.stringify(referenceImages) : null;

    const result = await pool.query(
      `INSERT INTO cake_enquiries
        (customer_name, customer_email, customer_phone,
         cake_size, cake_flavour, filling, frosting,
         tiers, servings, message_on_cake, special_requests,
         reference_images, event_type, event_date, estimated_price_pence, deposit_pence,
         delivery_address_line1, delivery_address_line2, delivery_city,
         delivery_postcode, delivery_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        customerName, customerEmail, customerPhone || null,
        cakeSize, cakeFlavour, filling || null, frosting || null,
        tiers || 1, servings || null, messageOnCake || null, specialRequests || null,
        refImagesJson, eventType || null, eventDate || null, estimatedPricePence, depositPence,
        deliveryAddressLine1 || null, deliveryAddressLine2 || null, deliveryCity || null,
        deliveryPostcode || null, deliveryNotes || null,
      ]
    );

    const enquiry = result.rows[0];

    // Notify admin of new enquiry
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Custom Cake Enquiry from ${customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px; background: #1a1a1a;">
              <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
              <h2 style="color: #333;">New Custom Cake Enquiry</h2>
              <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
              <p><strong>Size:</strong> ${cakeSize}</p>
              <p><strong>Flavour:</strong> ${cakeFlavour}</p>
              <p><strong>Filling:</strong> ${filling || 'None specified'}</p>
              <p><strong>Frosting:</strong> ${frosting || 'None specified'}</p>
              ${messageOnCake ? `<p><strong>Message on cake:</strong> ${messageOnCake}</p>` : ''}
              ${specialRequests ? `<p><strong>Special requests:</strong> ${specialRequests}</p>` : ''}
              ${referenceImages?.length ? `
                <p><strong>Reference Images:</strong></p>
                <div>${referenceImages.map((url, i) => `<a href="${url}" target="_blank" style="display:inline-block;margin:4px;"><img src="${url}" alt="Reference ${i + 1}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #ddd;" /></a>`).join('')}</div>
              ` : ''}
              ${eventType ? `<p><strong>Event:</strong> ${eventType}</p>` : ''}
              ${eventDate ? `<p><strong>Date needed:</strong> ${eventDate}</p>` : ''}
              <p><strong>Estimated price:</strong> £${(estimatedPricePence / 100).toFixed(2)}</p>
              <p><strong>Deposit (50%):</strong> £${(depositPence / 100).toFixed(2)}</p>
            </div>
          </div>
        `,
        text: `New enquiry from ${customerName} (${customerEmail})\nSize: ${cakeSize}, Flavour: ${cakeFlavour}\nEstimated: £${(estimatedPricePence / 100).toFixed(2)}`,
      }).catch((err) => console.error("Enquiry admin email failed:", err));
    }

    return res.status(201).json({ enquiry });
  } catch (e) {
    console.error("submitEnquiry error:", e);
    return res.status(500).json({ error: "Failed to submit enquiry" });
  }
}

// POST /api/enquiries/:id/deposit - Create Stripe session for deposit payment
export async function createDepositSession(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM cake_enquiries WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Enquiry not found" });

    const enquiry = result.rows[0];

    if (enquiry.deposit_status === 'paid') {
      return res.status(400).json({ error: "Deposit already paid" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: enquiry.customer_email,
      line_items: [{
        price_data: {
          currency: "gbp",
          unit_amount: enquiry.deposit_pence,
          product_data: {
            name: `Custom Cake Deposit - ${enquiry.cake_size} ${enquiry.cake_flavour}`,
            description: "50% deposit for your custom cake order",
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/custom-cake/success?enquiry_id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/custom-cake`,
      metadata: {
        enquiry_id: id,
        type: "cake_deposit",
      },
    });

    await pool.query(
      "UPDATE cake_enquiries SET stripe_session_id = $2, updated_at = NOW() WHERE id = $1",
      [id, session.id]
    );

    return res.json({ url: session.url });
  } catch (e) {
    console.error("createDepositSession error:", e);
    return res.status(500).json({ error: "Failed to create deposit session" });
  }
}

// POST /api/enquiries/:id/confirm-deposit - Confirm deposit after Stripe redirect
export async function confirmDeposit(req, res) {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const result = await pool.query("SELECT * FROM cake_enquiries WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Enquiry not found" });

    const enquiry = result.rows[0];

    if (enquiry.deposit_status === 'paid') {
      return res.json({ enquiry, alreadyPaid: true });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not confirmed" });
    }

    const updated = await pool.query(
      `UPDATE cake_enquiries
       SET deposit_status = 'paid', status = 'deposit_paid', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    // Send confirmation email to customer
    sendEmail({
      to: enquiry.customer_email,
      subject: `Deposit Confirmed - Custom Cake Order - A&L Bakes`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background: #1a1a1a;">
            <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">Deposit Received!</h2>
            <p>Hi ${enquiry.customer_name},</p>
            <p>We've received your deposit of <strong>£${(enquiry.deposit_pence / 100).toFixed(2)}</strong> for your custom ${enquiry.cake_flavour} cake.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Size:</strong> ${enquiry.cake_size}</p>
              <p style="margin: 4px 0;"><strong>Flavour:</strong> ${enquiry.cake_flavour}</p>
              ${enquiry.filling ? `<p style="margin: 4px 0;"><strong>Filling:</strong> ${enquiry.filling}</p>` : ''}
              ${enquiry.frosting ? `<p style="margin: 4px 0;"><strong>Frosting:</strong> ${enquiry.frosting}</p>` : ''}
              ${enquiry.event_date ? `<p style="margin: 4px 0;"><strong>Date needed:</strong> ${new Date(enquiry.event_date).toLocaleDateString('en-GB')}</p>` : ''}
            </div>
            <p>We'll be in touch soon to confirm the details. The remaining balance of <strong>£${((enquiry.estimated_price_pence - enquiry.deposit_pence) / 100).toFixed(2)}</strong> is due on collection/delivery.</p>
            <p>Questions? Reply to this email or reach out on <a href="https://www.instagram.com/al_bakess/" style="color: #f5a623;">Instagram</a></p>
          </div>
          <div style="text-align: center; padding: 20px; background: #f5f5f5; color: #888; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} A&L Bakes. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Deposit of £${(enquiry.deposit_pence / 100).toFixed(2)} received for your custom ${enquiry.cake_flavour} cake. We'll be in touch soon!`,
    }).catch((err) => console.error("Deposit confirmation email failed:", err));

    return res.json({ enquiry: updated.rows[0] });
  } catch (e) {
    console.error("confirmDeposit error:", e);
    return res.status(500).json({ error: "Failed to confirm deposit" });
  }
}

// GET /api/enquiries/:id - Get enquiry by ID (for success page)
export async function getEnquiry(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM cake_enquiries WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Enquiry not found" });
    return res.json({ enquiry: result.rows[0] });
  } catch (e) {
    console.error("getEnquiry error:", e);
    return res.status(500).json({ error: "Failed to fetch enquiry" });
  }
}

// GET /api/admin/enquiries - Admin list all enquiries
export async function adminListEnquiries(req, res) {
  try {
    const status = (req.query.status || "").trim();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = Math.max(0, Number(req.query.offset || 0));

    let where = "";
    const params = [];
    let i = 1;

    if (status) {
      where = `WHERE status = $${i++}`;
      params.push(status);
    }

    const result = await pool.query(
      `SELECT * FROM cake_enquiries ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    return res.json({ enquiries: result.rows, limit, offset });
  } catch (e) {
    console.error("adminListEnquiries error:", e);
    return res.status(500).json({ error: "Failed to list enquiries" });
  }
}

// PATCH /api/admin/enquiries/:id - Admin update enquiry status
export async function adminUpdateEnquiry(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const ALLOWED = ['new', 'deposit_paid', 'in_progress', 'ready', 'completed', 'cancelled'];
    if (status && !ALLOWED.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const current = await pool.query("SELECT * FROM cake_enquiries WHERE id = $1", [id]);
    if (!current.rows.length) return res.status(404).json({ error: "Enquiry not found" });

    const sets = [];
    const params = [];
    let i = 1;

    if (status) {
      sets.push(`status = $${i++}`);
      params.push(status);
    }
    if (adminNotes !== undefined) {
      sets.push(`admin_notes = $${i++}`);
      params.push(adminNotes);
    }
    sets.push(`updated_at = NOW()`);

    params.push(id);
    const result = await pool.query(
      `UPDATE cake_enquiries SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );

    /**
     * =============================================================================
     * AUTOMATED FINAL PAYMENT TRIGGER
     * =============================================================================
     *
     * WHEN: Admin changes status to 'ready'
     * CONDITION: Deposit must be paid AND final payment not yet completed
     * ACTION: Automatically create Stripe payment link and email customer
     *
     * WHY: Automates the payment collection process, reduces admin work,
     *      improves customer experience with instant payment link
     *
     * FLOW:
     * 1. Check if status changed to 'ready'
     * 2. Verify deposit was paid (ensures customer is committed)
     * 3. Check final payment is still pending (prevent duplicate links)
     * 4. Calculate remaining balance (total - deposit)
     * 5. Create Stripe Checkout Session for final payment
     * 6. Save session URL to database (for admin reference)
     * 7. Send email with payment link to customer
     */
    const enquiry = result.rows[0];

    if (status === 'ready' &&
        enquiry.deposit_status === 'paid' &&
        enquiry.final_payment_status === 'pending') {

      try {
        // STEP 1: Calculate final amount (total price - already paid deposit)
        const finalAmount = enquiry.estimated_price_pence - enquiry.deposit_pence;

        console.log(`Creating final payment link for enquiry ${id}:`, {
          total: enquiry.estimated_price_pence,
          deposit: enquiry.deposit_pence,
          finalAmount,
        });

        // STEP 2: Create Stripe Checkout Session
        // This generates a hosted payment page that the customer can use
        const session = await stripe.checkout.sessions.create({
          mode: "payment", // One-time payment (not subscription)
          customer_email: enquiry.customer_email,

          // STRIPE LINE ITEMS: What the customer is paying for
          line_items: [{
            price_data: {
              currency: "gbp",
              unit_amount: finalAmount, // Amount in pence
              product_data: {
                name: `Final Payment - ${enquiry.cake_size} ${enquiry.cake_flavour} Cake`,
                description: `Remaining balance for your custom cake order`,
              },
            },
            quantity: 1,
          }],

          // SUCCESS URL: Where Stripe redirects after successful payment
          // {CHECKOUT_SESSION_ID} is replaced by Stripe with actual session ID
          success_url: `${process.env.FRONTEND_URL}/custom-cake/final-payment-success?enquiry_id=${id}&session_id={CHECKOUT_SESSION_ID}`,

          // CANCEL URL: Where Stripe redirects if customer cancels
          cancel_url: `${process.env.FRONTEND_URL}/custom-cake`,

          // METADATA: Custom data we can retrieve later (not shown to customer)
          // Used to link this payment back to our enquiry
          metadata: {
            enquiry_id: id,
            type: "cake_final_payment",
          },
        });

        // STEP 3: Save payment link to database
        // Allows admin to resend link manually if needed
        await pool.query(
          `UPDATE cake_enquiries
           SET final_payment_pence = $1,
               final_payment_stripe_session_id = $2,
               final_payment_link = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [finalAmount, session.id, session.url, id]
        );

        console.log(`Payment link created successfully: ${session.url}`);

        // STEP 4: Send email with payment link to customer
        sendEmail({
          to: enquiry.customer_email,
          subject: `🎂 Your Cake is Ready! - Final Payment - A&L Bakes`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px; background: #1a1a1a;">
                <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
              </div>
              <div style="padding: 30px; background: #fff;">
                <h2 style="color: #333;">🎂 Your Cake is Ready!</h2>
                <p>Hi ${enquiry.customer_name},</p>
                <p>Great news! Your custom <strong>${enquiry.cake_flavour}</strong> cake is ready for collection/delivery.</p>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f5a623;">
                  <p style="margin: 4px 0;"><strong>Cake:</strong> ${enquiry.cake_size} ${enquiry.cake_flavour}</p>
                  ${enquiry.filling ? `<p style="margin: 4px 0;"><strong>Filling:</strong> ${enquiry.filling}</p>` : ''}
                  ${enquiry.frosting ? `<p style="margin: 4px 0;"><strong>Frosting:</strong> ${enquiry.frosting}</p>` : ''}
                  ${enquiry.event_date ? `<p style="margin: 4px 0;"><strong>Event Date:</strong> ${new Date(enquiry.event_date).toLocaleDateString('en-GB')}</p>` : ''}
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 12px 0;" />
                  <p style="margin: 4px 0;"><strong>Total Price:</strong> £${(enquiry.estimated_price_pence / 100).toFixed(2)}</p>
                  <p style="margin: 4px 0;"><strong>Deposit Paid:</strong> £${(enquiry.deposit_pence / 100).toFixed(2)} ✓</p>
                  <p style="margin: 4px 0; font-size: 18px; color: #f5a623;"><strong>Remaining Balance:</strong> £${(finalAmount / 100).toFixed(2)}</p>
                </div>

                ${adminNotes ? `<p style="background: #fff3cd; padding: 12px; border-radius: 8px; border-left: 4px solid #f5a623; margin: 16px 0;"><strong>📝 Note from bakery:</strong> ${adminNotes}</p>` : ''}

                <p style="margin: 24px 0;">Please complete your final payment using the button below:</p>

                <div style="text-align: center; margin: 24px 0;">
                  <a href="${session.url}" style="display: inline-block; padding: 16px 32px; background: #f5a623; color: #000; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                    Pay Final Balance - £${(finalAmount / 100).toFixed(2)}
                  </a>
                </div>

                <p style="font-size: 13px; color: #666; margin-top: 20px;">🔒 Secure payment via Stripe. This link expires in 24 hours. If you need assistance, reply to this email or contact us on Instagram.</p>
              </div>
              <div style="text-align: center; padding: 20px; background: #f5f5f5; color: #888; font-size: 12px;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} A&L Bakes. All rights reserved.</p>
              </div>
            </div>
          `,
          text: `Your ${enquiry.cake_flavour} cake is ready! Please pay the remaining balance of £${(finalAmount / 100).toFixed(2)} at: ${session.url}`,
        }).catch((err) => console.error("❌ Final payment email failed:", err));

        console.log('✅ Final payment email sent successfully');

      } catch (err) {
        // Log error but don't fail the status update
        // Admin can manually send payment link if needed
        console.error("❌ Failed to create final payment session:", err);
      }
    }

    /**
     * =============================================================================
     * NOTIFY CUSTOMER OF OTHER STATUS CHANGES
     * =============================================================================
     *
     * For status changes OTHER than 'ready' (which is handled above)
     * Send a simple notification email to keep customer informed
     */
    if (status && status !== 'ready' && enquiry.customer_email) {
      const statusLabels = {
        in_progress: "In Progress - We're working on your cake!",
        completed: "Completed - Thank you!",
        cancelled: "Cancelled",
      };
      const label = statusLabels[status];

      if (label) {
        sendEmail({
          to: enquiry.customer_email,
          subject: `Custom Cake Update: ${label} - A&L Bakes`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; padding: 20px; background: #1a1a1a;">
                <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
              </div>
              <div style="padding: 30px; background: #fff;">
                <h2 style="color: #333;">Custom Cake Update</h2>
                <p>Hi ${enquiry.customer_name},</p>
                <p>Your custom cake order has been updated to: <strong>${label}</strong></p>
                ${adminNotes ? `<p style="background: #f9f9f9; padding: 12px; border-radius: 8px; border-left: 4px solid #f5a623; margin: 16px 0;">${adminNotes}</p>` : ''}
                <p>Questions? Reply to this email or reach out on <a href="https://www.instagram.com/al_bakess/" style="color: #f5a623;">Instagram</a></p>
              </div>
            </div>
          `,
          text: `Your custom cake order has been updated to: ${label}`,
        }).catch((err) => console.error("Enquiry status email failed:", err));
      }
    }

    return res.json({ enquiry: result.rows[0] });
  } catch (e) {
    console.error("adminUpdateEnquiry error:", e);
    return res.status(500).json({ error: "Failed to update enquiry" });
  }
}

/**
 * =============================================================================
 * CONFIRM FINAL PAYMENT
 * =============================================================================
 *
 * ENDPOINT: POST /api/enquiries/:id/confirm-final-payment
 *
 * WHEN: Called by frontend after customer completes payment on Stripe
 * FLOW: Stripe redirects to success page → frontend calls this endpoint
 *
 * PURPOSE:
 * 1. Verify payment was actually completed (check with Stripe)
 * 2. Update enquiry status to 'completed'
 * 3. Update final_payment_status to 'paid'
 * 4. Send confirmation email to customer
 *
 * SECURITY:
 * - We verify payment with Stripe API (not trusting frontend)
 * - Check payment_status === 'paid' before marking as complete
 * - Idempotent: safe to call multiple times (returns existing if already paid)
 */
export async function confirmFinalPayment(req, res) {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    // STEP 1: Validate input
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    // STEP 2: Get enquiry from database
    const result = await pool.query(
      "SELECT * FROM cake_enquiries WHERE id = $1",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    const enquiry = result.rows[0];

    // STEP 3: IDEMPOTENCY CHECK
    // If final payment already marked as paid, return success immediately
    // This prevents duplicate processing if user refreshes the page
    if (enquiry.final_payment_status === 'paid') {
      console.log(`Final payment already confirmed for enquiry ${id}`);
      return res.json({ enquiry, alreadyPaid: true });
    }

    // STEP 4: VERIFY WITH STRIPE
    // Never trust the frontend - always verify payment status with Stripe
    console.log(`Verifying final payment with Stripe for session: ${sessionId}`);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if Stripe confirms payment was successful
    if (session.payment_status !== "paid") {
      console.log(`Payment not confirmed by Stripe: ${session.payment_status}`);
      return res.status(400).json({
        error: "Payment not confirmed",
        payment_status: session.payment_status,
      });
    }

    console.log(`✅ Stripe confirmed payment for enquiry ${id}`);

    // STEP 5: UPDATE DATABASE
    // Mark final payment as paid and enquiry as completed
    const updated = await pool.query(
      `UPDATE cake_enquiries
       SET final_payment_status = 'paid',
           status = 'completed',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    const updatedEnquiry = updated.rows[0];

    // STEP 6: SEND COMPLETION EMAIL
    // Confirm to customer that payment was received
    sendEmail({
      to: enquiry.customer_email,
      subject: `✅ Payment Complete - Thank You! - A&L Bakes`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background: #1a1a1a;">
            <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #28a745;">✅ Payment Complete!</h2>
            <p>Hi ${enquiry.customer_name},</p>
            <p>Thank you! We've received your final payment of <strong>£${(enquiry.final_payment_pence / 100).toFixed(2)}</strong>.</p>

            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0; color: #155724;"><strong>✓ Deposit:</strong> £${(enquiry.deposit_pence / 100).toFixed(2)} - Paid</p>
              <p style="margin: 4px 0; color: #155724;"><strong>✓ Final Payment:</strong> £${(enquiry.final_payment_pence / 100).toFixed(2)} - Paid</p>
              <hr style="border: none; border-top: 1px solid #c3e6cb; margin: 8px 0;" />
              <p style="margin: 4px 0; color: #155724; font-size: 16px;"><strong>✓ Total Paid:</strong> £${(enquiry.estimated_price_pence / 100).toFixed(2)}</p>
            </div>

            <p>Your <strong>${enquiry.cake_flavour}</strong> cake is ready for ${enquiry.delivery_address_line1 ? 'delivery' : 'collection'}!</p>

            ${enquiry.delivery_address_line1 ? `
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5a623;">
                <p style="margin: 4px 0; font-weight: 600;">📍 Delivery Address:</p>
                <p style="margin: 4px 0;">${enquiry.delivery_address_line1}</p>
                ${enquiry.delivery_address_line2 ? `<p style="margin: 4px 0;">${enquiry.delivery_address_line2}</p>` : ''}
                <p style="margin: 4px 0;">${enquiry.delivery_city || ''} ${enquiry.delivery_postcode || ''}</p>
                ${enquiry.delivery_notes ? `<p style="margin: 8px 0 4px; font-style: italic;">Note: ${enquiry.delivery_notes}</p>` : ''}
              </div>
            ` : ''}

            ${enquiry.event_date ? `<p><strong>Event Date:</strong> ${new Date(enquiry.event_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}

            <p style="margin-top: 20px;">Questions? Reply to this email or reach out on <a href="https://www.instagram.com/al_bakess/" style="color: #f5a623;">Instagram @al_bakess</a></p>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
              Thank you for choosing A&L Bakes! We hope you enjoy your cake! 🎂
            </p>
          </div>
          <div style="text-align: center; padding: 20px; background: #f5f5f5; color: #888; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} A&L Bakes. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Payment of £${(enquiry.final_payment_pence / 100).toFixed(2)} received. Your ${enquiry.cake_flavour} cake is ready! Total paid: £${(enquiry.estimated_price_pence / 100).toFixed(2)}`,
    }).catch((err) => console.error("❌ Final payment confirmation email failed:", err));

    console.log('✅ Final payment confirmation email sent');

    return res.json({ enquiry: updatedEnquiry });

  } catch (e) {
    console.error("confirmFinalPayment error:", e);
    return res.status(500).json({ error: "Failed to confirm final payment" });
  }
}

// POST /api/enquiries/upload-images - Upload reference images to S3
export async function uploadReferenceImages(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadPromises = req.files.map((file) =>
      uploadEnquiryImage(file.buffer, file.originalname, file.mimetype)
    );
    const imageUrls = await Promise.all(uploadPromises);

    return res.json({ imageUrls });
  } catch (e) {
    console.error("uploadReferenceImages error:", e);
    return res.status(500).json({ error: "Failed to upload images" });
  }
}

// GET /api/enquiries/config - Public endpoint for cake builder options
export async function getCakeConfig(_req, res) {
  return res.json({
    sizes: [
      { value: '6inch', label: '6" Round', servings: '8-10', pricePence: 4500 },
      { value: '8inch', label: '8" Round', servings: '12-16', pricePence: 5500 },
      { value: '10inch', label: '10" Round', servings: '20-25', pricePence: 7000 },
      { value: '12inch', label: '12" Round', servings: '30-35', pricePence: 8500 },
      { value: '2tier', label: '2 Tier', servings: '40-50', pricePence: 12000 },
      { value: '3tier', label: '3 Tier', servings: '60-80', pricePence: 18000 },
    ],
    flavours: [
      'Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Carrot',
      'Funfetti', 'Coconut', 'Banana', 'Coffee', 'Strawberry',
    ],
    fillings: [
      'Buttercream', 'Jam', 'Chocolate Ganache', 'Cream Cheese',
      'Lemon Curd', 'Fresh Fruit', 'Nutella', 'Salted Caramel',
    ],
    frostings: [
      'Buttercream', 'Fondant', 'Cream Cheese', 'Chocolate Ganache',
      'Naked (unfrosted)', 'Semi-naked', 'Whipped Cream',
    ],
    eventTypes: [
      'Birthday', 'Wedding', 'Anniversary', 'Baby Shower',
      'Graduation', 'Corporate', 'Other',
    ],
  });
}
