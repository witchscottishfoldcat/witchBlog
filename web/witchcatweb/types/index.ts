export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  wordCount: number;
  description: string;
  tags: string[];
  content: string;
  encrypted?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}
