export type Email = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
};

export type GmailCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  query?: string;
  description?: string;
};
