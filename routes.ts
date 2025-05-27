import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { 
  insertBookSchema, 
  insertAudioBookSchema, 
  insertUserLibrarySchema,
  insertPurchaseSchema,
  insertShopProductSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Multer setup for image uploads
  const upload = multer({
    dest: 'temp_uploads/',
    fileFilter: (req, file, cb) => {
      // Allow only images
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // Helper function to convert image to WebP
  const convertToWebP = (inputPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const convert = spawn('convert', [
        inputPath,
        '-quality', '80',
        '-resize', '400x520^',  // Размер обложки книги
        '-gravity', 'center',
        '-extent', '400x520',
        outputPath
      ]);

      convert.on('close', (code) => {
        if (code === 0) {
          // Delete original file
          fs.unlinkSync(inputPath);
          resolve();
        } else {
          reject(new Error(`ImageMagick conversion failed with code ${code}`));
        }
      });

      convert.on('error', (error) => {
        reject(error);
      });
    });
  };

  // Upload cover image for books
  app.post("/api/upload/book-cover/:bookId", upload.single('cover'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const bookId = parseInt(req.params.bookId);
      const book = await storage.getBook(bookId);
      
      if (!book) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Book not found" });
      }

      const filename = `book-${bookId}-cover.webp`;
      const outputPath = path.join('client/public', filename);

      await convertToWebP(req.file.path, outputPath);

      // Update book with new cover path
      await storage.updateBook(bookId, { coverImage: `/${filename}` });

      res.json({ 
        message: "Cover uploaded successfully", 
        coverImage: `/${filename}` 
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload cover" });
    }
  });

  // Upload cover image for audiobooks
  app.post("/api/upload/audiobook-cover/:audioBookId", upload.single('cover'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const audioBookId = parseInt(req.params.audioBookId);
      const audioBook = await storage.getAudioBook(audioBookId);
      
      if (!audioBook) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "AudioBook not found" });
      }

      const filename = `audiobook-${audioBookId}-cover.webp`;
      const outputPath = path.join('client/public', filename);

      await convertToWebP(req.file.path, outputPath);

      // Update audiobook with new cover path
      await storage.updateAudioBook(audioBookId, { coverImage: `/${filename}` });

      res.json({ 
        message: "Cover uploaded successfully", 
        coverImage: `/${filename}` 
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload cover" });
    }
  });

  // Upload image for shop products
  app.post("/api/upload/product-image/:productId", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const productId = parseInt(req.params.productId);
      const product = await storage.getShopProduct(productId);
      
      if (!product) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Product not found" });
      }

      const filename = `product-${productId}-image.webp`;
      const outputPath = path.join('client/public', filename);

      // For shop products, use square format
      const convertProduct = spawn('convert', [
        req.file.path,
        '-quality', '80',
        '-resize', '300x300^',
        '-gravity', 'center',
        '-extent', '300x300',
        outputPath
      ]);

      await new Promise((resolve, reject) => {
        convertProduct.on('close', (code) => {
          if (code === 0) {
            fs.unlinkSync(req.file.path);
            resolve(void 0);
          } else {
            reject(new Error(`ImageMagick conversion failed with code ${code}`));
          }
        });
        convertProduct.on('error', reject);
      });

      // Update product with new image path
      await storage.updateShopProduct(productId, { imageUrl: `/${filename}` });

      res.json({ 
        message: "Image uploaded successfully", 
        imageUrl: `/${filename}` 
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Books
  // Trash endpoints - separate path to avoid conflicts
  app.get("/api/trash/books", async (req, res) => {
    try {
      const deletedBooks = await storage.getDeletedBooks();
      res.json(deletedBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deleted books" });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const isPremium = req.query.isPremium ? req.query.isPremium === 'true' : undefined;
      const books = await storage.getBooks(categoryId, isPremium);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const books = await storage.searchBooks(query);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to search books" });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const book = await storage.createBook(req.body);
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.put("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedBook = await storage.updateBook(id, req.body);
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBook(id);
      if (!deleted) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.post("/api/books/:id/restore", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.restoreBook(id);
      if (success) {
        res.json({ message: "Book restored successfully" });
      } else {
        res.status(404).json({ message: "Book not found in trash" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to restore book" });
    }
  });

  // Audio Books
  app.get("/api/audio-books", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const isPremium = req.query.isPremium ? req.query.isPremium === 'true' : undefined;
      const audioBooks = await storage.getAudioBooks(categoryId, isPremium);
      res.json(audioBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio books" });
    }
  });

  app.get("/api/audio-books/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const audioBooks = await storage.searchAudioBooks(query);
      res.json(audioBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search audio books" });
    }
  });

  app.post("/api/audio-books", async (req, res) => {
    try {
      const audioBook = await storage.createAudioBook(req.body);
      res.json(audioBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to create audio book" });
    }
  });

  app.put("/api/audio-books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedAudioBook = await storage.updateAudioBook(id, req.body);
      if (!updatedAudioBook) {
        return res.status(404).json({ message: "Audio book not found" });
      }
      res.json(updatedAudioBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update audio book" });
    }
  });

  app.delete("/api/audio-books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAudioBook(id);
      if (!deleted) {
        return res.status(404).json({ message: "Audio book not found" });
      }
      res.json({ message: "Audio book deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete audio book" });
    }
  });

  app.get("/api/audio-books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audioBook = await storage.getAudioBook(id);
      if (!audioBook) {
        return res.status(404).json({ message: "Audio book not found" });
      }
      res.json(audioBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audio book" });
    }
  });

  // User Library
  app.get("/api/library/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const library = await storage.getUserLibrary(userId);
      res.json(library);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user library" });
    }
  });

  app.post("/api/library", async (req, res) => {
    try {
      const validatedData = insertUserLibrarySchema.parse(req.body);
      const libraryItem = await storage.addToLibrary(validatedData);
      res.status(201).json(libraryItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to library" });
    }
  });

  app.patch("/api/library/progress", async (req, res) => {
    try {
      const { userId, bookId, audioBookId, progress } = req.body;
      
      if (!userId || progress === undefined) {
        return res.status(400).json({ message: "userId and progress are required" });
      }
      
      if (!bookId && !audioBookId) {
        return res.status(400).json({ message: "Either bookId or audioBookId is required" });
      }

      await storage.updateProgress(userId, bookId, audioBookId, progress);
      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Purchases
  app.get("/api/purchases/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const validatedData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(validatedData);
      res.status(201).json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.get("/api/purchases/:userId/check", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookId = req.query.bookId ? parseInt(req.query.bookId as string) : undefined;
      const audioBookId = req.query.audioBookId ? parseInt(req.query.audioBookId as string) : undefined;
      
      const hasPurchased = await storage.hasPurchased(userId, bookId, audioBookId);
      res.json({ hasPurchased });
    } catch (error) {
      res.status(500).json({ message: "Failed to check purchase status" });
    }
  });

  // Shop Products
  app.get("/api/shop-products", async (req, res) => {
    try {
      const products = await storage.getShopProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop products" });
    }
  });

  app.post("/api/shop-products", async (req, res) => {
    try {
      const validatedData = insertShopProductSchema.parse(req.body);
      const product = await storage.createShopProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shop product" });
    }
  });

  app.put("/api/shop-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProduct = await storage.updateShopProduct(id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Shop product not found" });
      }
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update shop product" });
    }
  });

  app.delete("/api/shop-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteShopProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Shop product not found" });
      }
      res.json({ message: "Shop product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete shop product" });
    }
  });

  app.get("/api/shop-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getShopProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Shop product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop product" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
