import emailjs from '@emailjs/nodejs';

function normalizeEmailPayload(formData) {
  const source = formData && typeof formData === 'object' && !Array.isArray(formData)
    ? formData
    : {};

  const normalized = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== null)
  );

  const requiredFields = ['name', 'company', 'designation', 'email', 'call', 'country', 'message'];
  requiredFields.forEach((field) => {
    if (!(field in normalized)) {
      normalized[field] = '';
    }
  });

  return {
    ...normalized,
    title: normalized.title || 'Send me the Pitch deck'
  };
}

export async function sendPitchDeckEmail(formData) {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS environment variables are not configured.');
  }

  const templateParams = normalizeEmailPayload(formData);
  console.log('Payload for EmailJS:', templateParams);

  try {
    return await emailjs.send(serviceId, templateId, templateParams, { publicKey });
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.text ||
      error?.message ||
      'Failed to send email.';

    console.error('EmailJS send failed:', error);
    throw new Error(message);
  }
}
