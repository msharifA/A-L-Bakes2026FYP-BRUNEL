
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/checkout.css";

export default function Checkout() {
  const { cart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    pickupDate: "",
  });

  const [errors, setErrors] = useState({});

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  function validatePickupDate(dateStr) {
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected > today;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field as user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.pickupDate) {
      newErrors.pickupDate = "Pickup date is required";
    } else if (!validatePickupDate(formData.pickupDate)) {
      newErrors.pickupDate = "Pickup date must be in the future";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Store checkout details in sessionStorage for CheckoutReview
    sessionStorage.setItem("checkoutData", JSON.stringify(formData));
    navigate("/checkout/review");
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <p>Your cart is empty. Please add items before checkout.</p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Contact Information</legend>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <span id="email-error" className="error-message">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <span id="firstName-error" className="error-message">
                  {errors.firstName}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
              />
              {errors.lastName && (
                <span id="lastName-error" className="error-message">
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Pickup Details</legend>
          <div className="form-group">
            <label htmlFor="pickupDate">Pickup Date *</label>
            <input
              id="pickupDate"
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
              aria-invalid={!!errors.pickupDate}
              aria-describedby={errors.pickupDate ? "pickupDate-error" : undefined}
            />
            {errors.pickupDate && (
              <span id="pickupDate-error" className="error-message">
                {errors.pickupDate}
              </span>
            )}
          </div>
        </fieldset>

        <button type="submit" className="btn-primary">
          Review Order
        </button>
      </form>
    </div>
  );
}