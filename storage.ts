import { 
  users, categories, books, audioBooks, userLibrary, purchases, shopProducts,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Book, type InsertBook,
  type AudioBook, type InsertAudioBook,
  type UserLibrary, type InsertUserLibrary,
  type Purchase, type InsertPurchase,
  type ShopProduct, type InsertShopProduct
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Books
  getBooks(categoryId?: number, isPremium?: boolean): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;
  getDeletedBooks(): Promise<Book[]>;
  restoreBook(id: number): Promise<boolean>;
  searchBooks(query: string): Promise<Book[]>;

  // Audio Books
  getAudioBooks(categoryId?: number, isPremium?: boolean): Promise<AudioBook[]>;
  getAudioBook(id: number): Promise<AudioBook | undefined>;
  createAudioBook(audioBook: InsertAudioBook): Promise<AudioBook>;
  updateAudioBook(id: number, audioBook: Partial<InsertAudioBook>): Promise<AudioBook | undefined>;
  deleteAudioBook(id: number): Promise<boolean>;
  searchAudioBooks(query: string): Promise<AudioBook[]>;

  // User Library
  getUserLibrary(userId: number): Promise<UserLibrary[]>;
  addToLibrary(library: InsertUserLibrary): Promise<UserLibrary>;
  updateProgress(userId: number, bookId?: number, audioBookId?: number, progress: number): Promise<void>;

  // Shop Products
  getShopProducts(): Promise<ShopProduct[]>;
  getShopProduct(id: number): Promise<ShopProduct | undefined>;
  createShopProduct(product: InsertShopProduct): Promise<ShopProduct>;
  updateShopProduct(id: number, product: Partial<InsertShopProduct>): Promise<ShopProduct | undefined>;
  deleteShopProduct(id: number): Promise<boolean>;

  // Purchases
  getUserPurchases(userId: number): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  hasPurchased(userId: number, bookId?: number, audioBookId?: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private books: Map<number, Book>;
  private audioBooks: Map<number, AudioBook>;
  private userLibrary: Map<number, UserLibrary>;
  private purchases: Map<number, Purchase>;
  private shopProducts: Map<number, ShopProduct>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentBookId: number;
  private currentAudioBookId: number;
  private currentLibraryId: number;
  private currentPurchaseId: number;
  private currentShopProductId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.books = new Map();
    this.audioBooks = new Map();
    this.userLibrary = new Map();
    this.purchases = new Map();
    this.shopProducts = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentBookId = 1;
    this.currentAudioBookId = 1;
    this.currentLibraryId = 1;
    this.currentPurchaseId = 1;
    this.currentShopProductId = 1;

    this.initializeData();
  }

  private initializeData() {
    // Initialize categories
    const defaultCategories: InsertCategory[] = [
      { name: "Сказки", description: "Волшебные истории для детей", icon: "🏰" },
      { name: "Приключения", description: "Захватывающие приключения", icon: "🗺️" },
      { name: "Обучающие", description: "Полезные и познавательные книги", icon: "📚" },
      { name: "Стихи", description: "Детские стихотворения", icon: "🎭" }
    ];

    defaultCategories.forEach(cat => this.createCategory(cat));

    // Initialize books
    const defaultBooks: InsertBook[] = [
      {
        title: "Колобок",
        author: "Русская народная сказка",
        description: "Классическая русская сказка о приключениях колобка",
        coverImage: "/kolobok-cover.webp",
        price: 0, // Бесплатно
        content: `Жили-были дед да баба. Вот просит дед бабу испечь колобок. Баба по коробу поскребла, по сусеку помела, набрала муки горсти две. Замесила тесто на сметане, скатала колобок, изжарила в масле и положила на окошко остывать.

Колобок полежал-полежал, да вдруг и покатился — с окна на лавку, с лавки на пол, по полу к двери, прыг через порог в сени, из сеней на крыльцо, с крыльца на двор, со двора за ворота, дальше и дальше.

<div style="text-align: center; margin: 20px 0;">
<img src="/book-cover-1.webp" alt="Колобок катится по дороге" style="width: 100%; max-width: 350px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>

Катится колобок по дороге, а навстречу ему заяц: "Колобок, колобок! Я тебя съем!" — "Не ешь меня, заяц! Я тебе песенку спою". И запел: "Я колобок, колобок! По коробу скребён, по сусеку метён, на сметане мешан, в печку сажён, на окошке стужён. Я от дедушки ушёл, я от бабушки ушёл, от тебя, зайца, не хитро уйти!"

И покатился колобок дальше — только заяц его и видел! Катится колобок по дороге, а навстречу ему волк: "Колобок, колобок! Я тебя съем!" — "Не ешь меня, волк! Я тебе песенку спою". И запел: "Я колобок, колобок! По коробу скребён, по сусеку метён, на сметане мешан, в печку сажён, на окошке стужён. Я от дедушки ушёл, я от бабушки ушёл, я от зайца ушёл, от тебя, волка, не хитро уйти!"

И покатился колобок дальше — только волк его и видел! Катится колобок по дороге, а навстречу ему медведь: "Колобок, колобок! Я тебя съем!" — "Не ешь меня, медведь! Я тебе песенку спою". И запел колобок: "Я колобок, колобок! По коробу скребён, по сусеку метён, на сметане мешан, в печку сажён, на окошке стужён. Я от дедушки ушёл, я от бабушки ушёл, я от зайца ушёл, я от волка ушёл, от тебя, медведь, не хитро уйти!"

И покатился колобок дальше — только медведь его и видел! Катится колобок по дороге, а навстречу ему лиса: "Здравствуй, колобок! Какой ты пригожий, какой ты румяный!" Колобок обрадовался, что его похвалили, и запел свою песенку. А лиса и говорит: "Какая славная песня! Только я, колобок, стара стала, плохо слышу. Сядь ко мне на мордочку да спой ещё разочек". Колобок обрадовался, что его песенку похвалили, прыгнул лисе на мордочку и запел. А лиса — ам! — и съела колобка.`,
        categoryId: 1,
        ageGroup: "3-6",
        isPremium: false,
        readingTime: 20,
        isDeleted: false
      },
      {
        title: "Репка",
        author: "Русская народная сказка", 
        description: "Сказка о дружбе и взаимопомощи",
        coverImage: "https://via.placeholder.com/200x300/FDE047/000000?text=Репка",
        price: 0,
        content: `Посадил дед репку. Выросла репка большая-пребольшая. Пошёл дед репку рвать: тянет-потянет, вытянуть не может!

Позвал дед бабку. Бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!

Позвала бабка внучку. Внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!

Позвала внучка Жучку. Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!

Позвала Жучка кошку. Кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут, вытянуть не могут!

Позвала кошка мышка. Мышка за кошку, кошка за Жучку, Жучка за внучку, внучка за бабку, бабка за дедку, дедка за репку — тянут-потянут — вытянули репку!`,
        categoryId: 1,
        ageGroup: "2-5",
        isPremium: false,
        readingTime: 15,
        isDeleted: false
      },
      {
        title: "Буратино",
        author: "Алексей Толстой",
        description: "Приключения деревянного мальчика",
        coverImage: "https://via.placeholder.com/200x300/1E3A8A/ffffff?text=Буратино",
        price: 19900, // 199 рублей
        content: `В одном городе жил старый шарманщик по имени Карло. Целый день он играл на шарманке и зарабатывал себе на хлеб. Жил он в каморке под лестницей.

Однажды, сидя перед очагом и размышляя о своей бедности, старый Карло услышал тоненький голосок: "Ой, ой, ой! Отпусти меня!" Карло удивился: "Кто это говорит?" Осмотрел каморку — никого нет.

Вдруг полено, которое лежало у очага, само собой зашевелилось. "Это очень странно, — подумал Карло. — Но из этого полена можно вырезать куклу и показывать с ней представления. Тогда я заработаю больше денег."

Взял Карло нож и начал строгать полено. Только срезал первую стружку — полено закричало: "Ой, как больно!" Но Карло не испугался и продолжал мастерить. Вскоре у него получилась деревянная кукла — мальчик с длинным носом.

"Как назвать тебя?" — размышлял Карло. И тут же вспомнил: "Назову-ка я тебя Буратино! Это имя принесёт тебе счастье."

Едва Карло произнёс это имя, кукла ожила. Буратино вскочил на ноги, схватил молоток и принялся колотить по наковальне: тук-тук-тук!

"Папа Карло, я есть хочу!" — закричал Буратино. Карло дал ему корочку хлеба. Буратино съел её в один миг и сказал: "Теперь я хочу в школу! Хочу стать умным и образованным!"

Эти слова так обрадовали папу Карло, что он решил продать свою куртку и купить для Буратино азбуку. На следующий день Буратино с азбукой под мышкой отправился в школу. Но по дороге его ждали удивительные приключения...`,
        categoryId: 2,
        ageGroup: "6-10",
        isPremium: true,
        readingTime: 45,
        isDeleted: false
      }
    ];

    defaultBooks.forEach(book => this.createBook(book));

    // Initialize audio books - только реальные аудиокниги
    const defaultAudioBooks: InsertAudioBook[] = [
      {
        title: "Автомобиль",
        author: "Носов Н.Н.",
        description: "Детская аудиокнига о приключениях с автомобилем",
        coverImage: "/avtomobil-cover.webp",
        audioUrl: "/avtomobil-audio.mp3",
        duration: 293, // 4:53 в секундах
        categoryId: 1,
        ageGroup: "3-8",
        isPremium: true,
        price: 24999, // 249.99₽ в копейках
        narrator: "Профессиональный диктор",
        isDeleted: false
      }
    ];

    defaultAudioBooks.forEach(audioBook => this.createAudioBook(audioBook));

    // Initialize shop products
    const defaultShopProducts: InsertShopProduct[] = [
      {
        name: "Футболка RIZY LAND детская",
        description: "Мягкая хлопковая футболка с логотипом RIZY LAND для юных читателей",
        price: 129900,
        category: "Одежда",
        imageUrl: "",
        stock: 50,
        isActive: true
      },
      {
        name: "Худи RIZY LAND с капюшоном",
        description: "Уютное худи для детей с яркими принтами из любимых книг",
        price: 249900,
        category: "Одежда",
        imageUrl: "",
        stock: 30,
        isActive: true
      },
      {
        name: "Закладка магнитная \"Колобок\"",
        description: "Красочная магнитная закладка с героями из популярной сказки",
        price: 19900,
        category: "Канцелярия",
        imageUrl: "",
        stock: 100,
        isActive: true
      },
      {
        name: "Блокнот \"Мои истории\" A5",
        description: "Красивый блокнот для записей и рисунков с мотивами из детских книг",
        price: 79900,
        category: "Канцелярия",
        imageUrl: "",
        stock: 75,
        isActive: true
      },
      {
        name: "Кружка \"Герои сказок\"",
        description: "Яркая детская кружка с любимыми персонажами из книг RIZY LAND",
        price: 69900,
        category: "Подарки",
        imageUrl: "",
        stock: 40,
        isActive: true
      },
      {
        name: "Рюкзак детский \"Приключения\"",
        description: "Удобный рюкзак для школы и прогулок с яркими иллюстрациями",
        price: 189900,
        category: "Аксессуары",
        imageUrl: "",
        stock: 25,
        isActive: true
      }
    ];

    defaultShopProducts.forEach(product => this.createShopProduct(product));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      id,
      name: insertCategory.name,
      description: insertCategory.description || null,
      icon: insertCategory.icon
    };
    this.categories.set(id, category);
    return category;
  }

  async getBooks(categoryId?: number, isPremium?: boolean): Promise<Book[]> {
    let books = Array.from(this.books.values()).filter(book => !book.isDeleted);
    
    if (categoryId !== undefined) {
      books = books.filter(book => book.categoryId === categoryId);
    }
    
    if (isPremium !== undefined) {
      books = books.filter(book => book.isPremium === isPremium);
    }
    
    return books;
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentBookId++;
    const book: Book = { 
      id,
      title: insertBook.title,
      author: insertBook.author,
      description: insertBook.description || null,
      coverImage: insertBook.coverImage || null,
      content: insertBook.content,
      categoryId: insertBook.categoryId || null,
      ageGroup: insertBook.ageGroup,
      isPremium: insertBook.isPremium || null,
      price: insertBook.price || null,
      readingTime: insertBook.readingTime || null,
      isDeleted: insertBook.isDeleted || null,
      createdAt: new Date()
    };
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: number, updateData: Partial<InsertBook>): Promise<Book | undefined> {
    const existingBook = this.books.get(id);
    if (!existingBook) {
      return undefined;
    }
    const updatedBook: Book = { ...existingBook, ...updateData };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    const book = this.books.get(id);
    if (book) {
      book.isDeleted = true;
      this.books.set(id, book);
      return true;
    }
    return false;
  }

  async getDeletedBooks(): Promise<Book[]> {
    return Array.from(this.books.values()).filter(book => book.isDeleted);
  }

  async restoreBook(id: number): Promise<boolean> {
    const book = this.books.get(id);
    if (book && book.isDeleted) {
      book.isDeleted = false;
      this.books.set(id, book);
      return true;
    }
    return false;
  }

  async searchBooks(query: string): Promise<Book[]> {
    const books = Array.from(this.books.values());
    const lowerQuery = query.toLowerCase();
    return books.filter(book => 
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery) ||
      book.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async getAudioBooks(categoryId?: number, isPremium?: boolean): Promise<AudioBook[]> {
    let audioBooks = Array.from(this.audioBooks.values());
    
    if (categoryId !== undefined) {
      audioBooks = audioBooks.filter(audioBook => audioBook.categoryId === categoryId);
    }
    
    if (isPremium !== undefined) {
      audioBooks = audioBooks.filter(audioBook => audioBook.isPremium === isPremium);
    }
    
    return audioBooks;
  }

  async getAudioBook(id: number): Promise<AudioBook | undefined> {
    return this.audioBooks.get(id);
  }

  async createAudioBook(insertAudioBook: InsertAudioBook): Promise<AudioBook> {
    const id = this.currentAudioBookId++;
    const audioBook: AudioBook = { 
      ...insertAudioBook, 
      id,
      createdAt: new Date()
    };
    this.audioBooks.set(id, audioBook);
    return audioBook;
  }

  async updateAudioBook(id: number, updateData: Partial<InsertAudioBook>): Promise<AudioBook | undefined> {
    const existingAudioBook = this.audioBooks.get(id);
    if (!existingAudioBook) {
      return undefined;
    }
    const updatedAudioBook: AudioBook = { ...existingAudioBook, ...updateData };
    this.audioBooks.set(id, updatedAudioBook);
    return updatedAudioBook;
  }

  async deleteAudioBook(id: number): Promise<boolean> {
    return this.audioBooks.delete(id);
  }

  async searchAudioBooks(query: string): Promise<AudioBook[]> {
    const audioBooks = Array.from(this.audioBooks.values());
    const lowerQuery = query.toLowerCase();
    return audioBooks.filter(audioBook => 
      audioBook.title.toLowerCase().includes(lowerQuery) ||
      audioBook.author.toLowerCase().includes(lowerQuery) ||
      audioBook.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async getUserLibrary(userId: number): Promise<UserLibrary[]> {
    return Array.from(this.userLibrary.values()).filter(item => item.userId === userId);
  }

  async addToLibrary(insertLibrary: InsertUserLibrary): Promise<UserLibrary> {
    const id = this.currentLibraryId++;
    const library: UserLibrary = { 
      ...insertLibrary, 
      id,
      addedAt: new Date()
    };
    this.userLibrary.set(id, library);
    return library;
  }

  async updateProgress(userId: number, bookId?: number, audioBookId?: number, progress: number): Promise<void> {
    const items = Array.from(this.userLibrary.values());
    const item = items.find(lib => 
      lib.userId === userId && 
      (bookId ? lib.bookId === bookId : lib.audioBookId === audioBookId)
    );
    
    if (item) {
      item.progress = progress;
      this.userLibrary.set(item.id, item);
    }
  }

  async getUserPurchases(userId: number): Promise<Purchase[]> {
    return Array.from(this.purchases.values()).filter(purchase => purchase.userId === userId);
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentPurchaseId++;
    const purchase: Purchase = { 
      ...insertPurchase, 
      id,
      purchasedAt: new Date()
    };
    this.purchases.set(id, purchase);
    return purchase;
  }

  async hasPurchased(userId: number, bookId?: number, audioBookId?: number): Promise<boolean> {
    const purchases = Array.from(this.purchases.values());
    return purchases.some(purchase => 
      purchase.userId === userId && 
      (bookId ? purchase.bookId === bookId : purchase.audioBookId === audioBookId)
    );
  }

  // Shop Products methods
  async getShopProducts(): Promise<ShopProduct[]> {
    return Array.from(this.shopProducts.values()).filter(product => product.isActive);
  }

  async getShopProduct(id: number): Promise<ShopProduct | undefined> {
    return this.shopProducts.get(id);
  }

  async createShopProduct(insertProduct: InsertShopProduct): Promise<ShopProduct> {
    const id = this.currentShopProductId++;
    const product: ShopProduct = {
      ...insertProduct,
      id,
      createdAt: new Date()
    };
    this.shopProducts.set(id, product);
    return product;
  }

  async updateShopProduct(id: number, updateData: Partial<InsertShopProduct>): Promise<ShopProduct | undefined> {
    const existingProduct = this.shopProducts.get(id);
    if (!existingProduct) return undefined;

    const updatedProduct: ShopProduct = { ...existingProduct, ...updateData };
    this.shopProducts.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteShopProduct(id: number): Promise<boolean> {
    const product = this.shopProducts.get(id);
    if (!product) return false;

    // Soft delete - mark as inactive
    product.isActive = false;
    this.shopProducts.set(id, product);
    return true;
  }
}

export const storage = new MemStorage();
