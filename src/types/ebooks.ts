
import { DownloadedBook, UserBook } from "@/lib/ebooks-storage";

export interface LibraryBook {
  title: string;
  file: string;
  url: string;
  size: string;
}

export type BookSource = LibraryBook | DownloadedBook | UserBook;
