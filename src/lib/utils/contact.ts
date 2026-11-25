/**
 * Single destination for feature/bug reports: the subject is what the support
 * mailbox filters on, so every "propose a feature" entry point must use it.
 */
const CONTACT_EMAIL = "louis.soltysiak@student.junia.com";
const CONTACT_SUBJECT = "Support/feature pour Mauria";

export const CONTACT_URL = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    CONTACT_SUBJECT
)}`;
