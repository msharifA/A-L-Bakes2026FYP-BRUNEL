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
         reference_images, event_type, event_date, estimated_price_pence, deposit_pence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        customerName, customerEmail, customerPhone || null,
        cakeSize, cakeFlavour, filling || null, frosting || null,
        tiers || 1, servings || null, messageOnCake || null, specialRequests || null,
        refImagesJson, eventType || null, eventDate || null, estimatedPricePence, depositPence,
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

    // Notify customer of status change
    const enquiry = result.rows[0];
    if (status && enquiry.customer_email) {
      const statusLabels = {
        in_progress: "In Progress - We're working on your cake!",
        ready: "Ready for Collection/Delivery",
        completed: "Completed",
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
                ${adminNotes ? `<p style="background: #f9f9f9; padding: 12px; border-radius: 8px; border-left: 4px solid #f5a623;">${adminNotes}</p>` : ''}
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
