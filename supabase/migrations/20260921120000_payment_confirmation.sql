CREATE OR REPLACE FUNCTION public.confirm_paid_registration(
  p_order_id text, p_payment_id text, p_signature text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_registration public.registrations%ROWTYPE;
  v_already_paid boolean;
BEGIN
  SELECT * INTO v_payment FROM public.payments
    WHERE razorpay_order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  v_already_paid := v_payment.status IN ('paid', 'captured');
  IF v_already_paid AND v_payment.razorpay_payment_id IS DISTINCT FROM p_payment_id THEN
    RAISE EXCEPTION 'Order already paid with another payment ID';
  END IF;
  IF NOT v_already_paid THEN
    UPDATE public.payments SET status = 'paid', razorpay_payment_id = p_payment_id,
      razorpay_signature = p_signature, paid_at = now(), updated_at = now()
      WHERE id = v_payment.id RETURNING * INTO v_payment;
    UPDATE public.registrations SET status = 'confirmed', updated_at = now()
      WHERE id = v_payment.registration_id RETURNING * INTO v_registration;
  ELSE
    SELECT * INTO v_registration FROM public.registrations WHERE id = v_payment.registration_id;
  END IF;
  RETURN jsonb_build_object('payment', to_jsonb(v_payment),
    'registration', to_jsonb(v_registration), 'already_paid', v_already_paid);
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_paid_registration(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_paid_registration(text, text, text) TO service_role;
