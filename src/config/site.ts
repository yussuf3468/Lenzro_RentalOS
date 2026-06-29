/** Static product metadata. */
export const siteConfig = {
  name: 'Lenzro RentalOS',
  shortName: 'RentalOS',
  company: 'Lenzro Software Solutions',
  tagline: 'The operating system for rental businesses.',
  description:
    'A multi-tenant platform to run your rental business — fleet, bookings, customers, finance and reports in one place.',
  url: 'https://rentalos.lenzro.com',
} as const;

export type SiteConfig = typeof siteConfig;
