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

export type Category = "all-mail" | "smart-search" | "important";

export interface CategoryState {
  selectedCategory: Category;
  setCategory: (category: Category) => void;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  category: Category;
  badge?: React.ReactNode;
}
