"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EventConfig, formatPrice } from "@/lib/events";
import { RegistrationFormData, CreateOrderResponse, VerifyPaymentResponse } from "@/lib/types/payment";
import styles from "./registration.module.css";

interface RegistrationModalProps {
  event: EventConfig;
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
    method?: string;
  };
  config?: {
    display?: {
      blocks?: Record<string, unknown>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
  theme: {
    color: string;
  };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal: {
    ondismiss: () => void;
  };
}

export default function RegistrationModal({ event, isOpen, onClose }: RegistrationModalProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    email: "",
    phone: "",
    college: "",
    year: "FY",
    branch: "",
    teamName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "initializing" | "checkout" | "verifying">("idle");

  // Load Razorpay Checkout Script safely
  useEffect(() => {
    if (typeof window === "undefined" || window.Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep script in document cache
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status === "idle") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, status, onClose]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    const cleanPhone = formData.phone.replace(/^(\+91|0)/, "").replace(/[\s-]/g, "");
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number.";
    }

    if (!formData.college.trim()) {
      newErrors.college = "College / Institute is required.";
    }

    if (!formData.year.trim()) {
      newErrors.year = "Year is required.";
    }

    if (!formData.branch.trim()) {
      newErrors.branch = "Branch / Specialization is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setGeneralError(null);
    setStatus("initializing");

    try {
      // 1. Create order on server (Frontend NEVER sends amount)
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          registration: formData,
        }),
      });

      const data = (await res.json()) as CreateOrderResponse;

      if (!res.ok || !data.success || !data.orderId) {
        setGeneralError(data.error || "Failed to initialize registration. Please try again.");
        setStatus("idle");
        return;
      }

      // Use dynamic key returned by backend, or environment fallback
      const rzpKey =
        data.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_TdrJgIUwLBS8tO";

      // If Razorpay SDK is available, open checkout modal
      if (typeof window !== "undefined" && window.Razorpay) {
        setStatus("checkout");

        const options: RazorpayOptions = {
          key: rzpKey,
          amount: data.amount || event.price * 100,
          currency: "INR",
          name: "PRAXIS '26",
          description: `Registration for ${event.title}`,
          order_id: data.orderId,
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
            method: "upi",
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay using UPI (GPay, PhonePe, Paytm, QR)",
                  instruments: [
                    {
                      method: "upi",
                    },
                  ],
                },
                other: {
                  name: "Cards, NetBanking & Wallets",
                  instruments: [
                    {
                      method: "card",
                    },
                    {
                      method: "netbanking",
                    },
                    {
                      method: "wallet",
                    },
                  ],
                },
              },
              sequence: ["block.upi", "block.other"],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          theme: {
            color: event.accent || "#00ff9c",
          },
          handler: async (response) => {
            setStatus("verifying");
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  registrationId: data.registrationId,
                }),
              });

              const verifyData = (await verifyRes.json()) as VerifyPaymentResponse;

              if (verifyRes.ok && verifyData.success) {
                onClose();
                router.push(
                  `/payment/success?reg=${encodeURIComponent(
                    verifyData.registrationCode || ""
                  )}&event=${encodeURIComponent(event.slug)}&pay=${encodeURIComponent(
                    verifyData.paymentId || ""
                  )}`
                );
              } else {
                setGeneralError(
                  verifyData.error || "Payment signature verification failed. Please contact support."
                );
                setStatus("idle");
              }
            } catch (vErr) {
              console.error("Verification call error:", vErr);
              setGeneralError("Network error while verifying payment. Please contact support.");
              setStatus("idle");
            }
          },
          modal: {
            ondismiss: () => {
              setStatus("idle");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for environments where checkout script is blocked / simulated
        console.warn("Razorpay script not loaded, running simulated verification");
        setStatus("verifying");
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: data.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_verified_sig",
            registrationId: data.registrationId,
          }),
        });
        const verifyData = (await verifyRes.json()) as VerifyPaymentResponse;
        if (verifyRes.ok && verifyData.success) {
          onClose();
          router.push(
            `/payment/success?reg=${encodeURIComponent(
              verifyData.registrationCode || ""
            )}&event=${encodeURIComponent(event.slug)}&pay=${encodeURIComponent(
              verifyData.paymentId || ""
            )}`
          );
        } else {
          setGeneralError(verifyData.error || "Simulation error");
          setStatus("idle");
        }
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      setGeneralError("An unexpected error occurred. Please try again.");
      setStatus("idle");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-modal-title"
      style={{ "--accent": event.accent } as React.CSSProperties}
      onClick={(e) => {
        if (e.target === e.currentTarget && status === "idle") {
          onClose();
        }
      }}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.kickerRow}>
            <span className={styles.themeBadge}>{event.theme}</span>
            <span className={styles.priceBadge}>Fee: {formatPrice(event.price)}</span>
          </div>
          <h2 id="reg-modal-title" className={styles.title}>
            Register for {event.title}
          </h2>
          {status === "idle" && (
            <button
              className={styles.closeButton}
              type="button"
              onClick={onClose}
              aria-label="Close registration modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleProceedToPayment} className={styles.body}>
          <div className={styles.formGrid}>
            {/* Full Name */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="reg-name" className={styles.label}>
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                placeholder="e.g. Maya Lin"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={status !== "idle"}
                autoFocus
              />
              {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-email" className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                placeholder="maya@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={status !== "idle"}
              />
              {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
            </div>

            {/* Phone */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-phone" className={styles.label}>
                Mobile Number <span className={styles.required}>*</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                maxLength={10}
                className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={status !== "idle"}
              />
              {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
            </div>

            {/* College */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="reg-college" className={styles.label}>
                College / Institute Name <span className={styles.required}>*</span>
              </label>
              <input
                id="reg-college"
                type="text"
                className={`${styles.input} ${errors.college ? styles.inputError : ""}`}
                placeholder="e.g. COEP Technological University"
                value={formData.college}
                onChange={(e) => handleChange("college", e.target.value)}
                disabled={status !== "idle"}
              />
              {errors.college && <span className={styles.errorMessage}>{errors.college}</span>}
            </div>

            {/* Year */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-year" className={styles.label}>
                Year of Study <span className={styles.required}>*</span>
              </label>
              <select
                id="reg-year"
                className={`${styles.select} ${errors.year ? styles.inputError : ""}`}
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                disabled={status !== "idle"}
              >
                <option value="FY">First Year (FY)</option>
                <option value="SY">Second Year (SY)</option>
                <option value="TY">Third Year (TY)</option>
                <option value="Final Year">Final Year (B.Tech / BE)</option>
                <option value="Post-Graduate">Post-Graduate / Masters</option>
              </select>
              {errors.year && <span className={styles.errorMessage}>{errors.year}</span>}
            </div>

            {/* Branch */}
            <div className={styles.formGroup}>
              <label htmlFor="reg-branch" className={styles.label}>
                Branch / Specialization <span className={styles.required}>*</span>
              </label>
              <input
                id="reg-branch"
                type="text"
                className={`${styles.input} ${errors.branch ? styles.inputError : ""}`}
                placeholder="e.g. Computer Engineering"
                value={formData.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                disabled={status !== "idle"}
              />
              {errors.branch && <span className={styles.errorMessage}>{errors.branch}</span>}
            </div>

            {/* Optional Team Name (for team events) */}
            {event.isTeamEvent && (
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="reg-team" className={styles.label}>
                  Squad / Team Name (Optional)
                </label>
                <input
                  id="reg-team"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Quantum Vanguard"
                  value={formData.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                  disabled={status !== "idle"}
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Selected Event:</span>
              <strong>{event.title}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Platform & Processing:</span>
              <span>Included</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total Payable:</span>
              <span className={styles.totalPrice}>{formatPrice(event.price)}</span>
            </div>
            <div className={styles.upiBadge}>
              <span className={styles.upiDot} />
              <span>⚡ Instant UPI (Google Pay, PhonePe, Paytm, QR) & Cards</span>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && <div className={styles.generalError}>{generalError}</div>}

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={status !== "idle"}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={status !== "idle"}
            >
              {status === "initializing" && (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  INITIALIZING PAYMENT...
                </>
              )}
              {status === "checkout" && (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  CHECKOUT ACTIVE...
                </>
              )}
              {status === "verifying" && (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  VERIFYING PAYMENT...
                </>
              )}
              {status === "idle" && (
                <>
                  PROCEED TO PAYMENT · {formatPrice(event.price)} ↗
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
