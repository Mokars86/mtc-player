import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));

// Initialize Stripe
const stripe = new Stripe(process.env.VITE_STRIPE_KEY);

app.post("/create-checkout-session", async (req, res) => {
    try {
        console.log("Received payment request:", req.body);

        const { amount, currency } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currency || "usd",
                        product_data: {
                            name: "MTc Player Support",
                            images: ["https://i.imgur.com/EHyR2nP.png"], // Placeholder image
                        },
                        unit_amount: amount, // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: "http://localhost:5173/success",
            cancel_url: "http://localhost:5173/cancel",
        });

        console.log("Session Created:", session.id);
        res.json({ id: session.id });
    } catch (error) {
        console.error("Stripe Error:", error.message);

        let statusCode = 500;
        let message = "Internal Server Error";

        if (error.type === 'StripeAuthenticationError' || error.statusCode === 401) {
            statusCode = 401;
            message = "Invalid Stripe API Key. Please use a valid Secret Key (sk_test_...).";
        } else if (error.type === 'StripeCardError') {
            statusCode = 400;
            message = error.message;
        } else if (error.raw && error.raw.message) {
            message = error.raw.message;
        }

        res.status(statusCode).json({ error: message });
    }
});

const PORT = 4242;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
