'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './admin.css';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AdminProduct {
  P_code: number;
  Product_code: string;
  P_name: string;
  P_Category: string;
  P_S_P: number;
  P_P_P: number;
  P_image: string | null;
  Date_time: string;
  is_available?: boolean;
}

export interface SalesRecord {
  Order_No: string;
  Date_Time: string;
  Total_Qty: number;
  Total_Amount: number;
  Order_Type: 'Dine-In' | 'Takeout' | 'Delivery';
  Payment_Method: 'Cash' | 'GCash / QR' | 'Card';
  Customer_Name: string;
  Status: 'Completed' | 'Preparing' | 'Ready' | 'Cancelled';
  Items: {
    P_Code: string;
    Product_Name: string;
    Quantity: number;
    Price: number;
    SubTotal: number;
  }[];
}

export interface StockLog {
  Sin_ID: number;
  Date_time: string;
  Product_code: string;
  P_name: string;
  Quantity: number;
  Cost_Price: number;
  Supplier: string;
}

export interface StaffAccount {
  ACC_ID: number;
  Acc_Name: string;
  User_ID: string;
  Role: 'Admin' | 'Manager' | 'Cashier';
  Date_Time: string;
}

// ─── Default Sample Data for kyleseatery ─────────────────────────────────────
const INITIAL_PRODUCTS: AdminProduct[] = [
  {
    P_code: 1,
    Product_code: 'KY-01',
    P_name: 'Chori Sandwich',
    P_Category: 'sandwiches',
    P_S_P: 199,
    P_P_P: 110,
    P_image: null,
    Date_time: '2026-10-01 10:30:00',
    is_available: true,
  },
  {
    P_code: 2,
    Product_code: 'KY-02',
    P_name: 'Backribs',
    P_Category: 'sizzling',
    P_S_P: 160,
    P_P_P: 95,
    P_image: null,
    Date_time: '2026-10-01 10:32:00',
    is_available: true,
  },
  {
    P_code: 3,
    Product_code: 'KY-03',
    P_name: 'Hungarian Sausage with Rice & Egg',
    P_Category: 'sizzling',
    P_S_P: 120,
    P_P_P: 70,
    P_image: null,
    Date_time: '2026-10-01 10:35:00',
    is_available: true,
  },
  {
    P_code: 4,
    Product_code: 'KY-04',
    P_name: 'Crispy Sizzling Pork Sisig Solo',
    P_Category: 'sizzling',
    P_S_P: 160,
    P_P_P: 85,
    P_image: 'uploads/SIG01_Sisig_Pork_Solo.jpg',
    Date_time: '2026-10-01 11:00:00',
    is_available: true,
  },
  {
    P_code: 5,
    Product_code: 'KY-05',
    P_name: 'Special Palabok',
    P_Category: 'appetizers',
    P_S_P: 50,
    P_P_P: 28,
    P_image: null,
    Date_time: '2026-10-01 11:05:00',
    is_available: true,
  },
  {
    P_code: 6,
    Product_code: 'KY-06',
    P_name: 'Caramelized Pork Tocino with Rice',
    P_Category: 'sizzling',
    P_S_P: 85,
    P_P_P: 45,
    P_image: null,
    Date_time: '2026-10-01 11:10:00',
    is_available: true,
  },
  {
    P_code: 7,
    Product_code: 'KY-07',
    P_name: 'Creamy Chicken Ala King',
    P_Category: 'sizzling',
    P_S_P: 99,
    P_P_P: 55,
    P_image: null,
    Date_time: '2026-10-01 11:15:00',
    is_available: true,
  },
  {
    P_code: 8,
    Product_code: 'KY-08',
    P_name: 'Crispy Fried Chicken Inasal with Rice',
    P_Category: 'inasal',
    P_S_P: 85,
    P_P_P: 48,
    P_image: 'uploads/KM02_PAA_With_Rice.jpg',
    Date_time: '2026-10-01 11:20:00',
    is_available: true,
  },
  {
    P_code: 9,
    Product_code: 'BS-01',
    P_name: 'Batchoy Special (Sunday Schedule)',
    P_Category: 'batchoy',
    P_S_P: 150,
    P_P_P: 80,
    P_image: null,
    Date_time: '2026-10-01 11:25:00',
    is_available: true,
  },
  {
    P_code: 10,
    Product_code: 'BS-02',
    P_name: 'Ordinary Batchoy (Sunday Schedule)',
    P_Category: 'batchoy',
    P_S_P: 100,
    P_P_P: 50,
    P_image: null,
    Date_time: '2026-10-01 11:30:00',
    is_available: true,
  },
  {
    P_code: 11,
    Product_code: 'BS-03',
    P_name: 'Crispy Golden Chicken Tempura',
    P_Category: 'appetizers',
    P_S_P: 120,
    P_P_P: 65,
    P_image: null,
    Date_time: '2026-10-01 11:35:00',
    is_available: true,
  },
  {
    P_code: 12,
    Product_code: 'KY-09',
    P_name: 'Fragrant Garlic & Egg Fried Rice',
    P_Category: 'rice',
    P_S_P: 45,
    P_P_P: 20,
    P_image: 'uploads/OD01_Rice.jpg',
    Date_time: '2026-10-01 11:40:00',
    is_available: true,
  },
  {
    P_code: 13,
    Product_code: 'DK-01',
    P_name: 'Coca-Cola Regular 8oz Bottle',
    P_Category: 'drinks',
    P_S_P: 35,
    P_P_P: 18,
    P_image: 'uploads/DK01_Coke_8oz.jpg',
    Date_time: '2026-10-01 11:45:00',
    is_available: true,
  },
  {
    P_code: 14,
    Product_code: 'SIG-02',
    P_name: 'Sizzling Sisig Pork Meal with Rice & Egg',
    P_Category: 'sizzling',
    P_S_P: 185,
    P_P_P: 95,
    P_image: 'uploads/SIG02_Sisig_Pork_Meal.jpg',
    Date_time: '2026-10-01 11:50:00',
    is_available: true,
  },
];

const INITIAL_SALES: SalesRecord[] = [
  {
    Order_No: 'ORD-1092',
    Date_Time: '2026-10-02 12:45:10',
    Total_Qty: 3,
    Total_Amount: 445,
    Order_Type: 'Dine-In',
    Payment_Method: 'Cash',
    Customer_Name: 'Table 03 - Marcus',
    Status: 'Completed',
    Items: [
      { P_Code: 'KY-04', Product_Name: 'Crispy Sizzling Pork Sisig Solo', Quantity: 1, Price: 160, SubTotal: 160 },
      { P_Code: 'KY-01', Product_Name: 'Chori Sandwich', Quantity: 1, Price: 199, SubTotal: 199 },
      { P_Code: 'KY-09', Product_Name: 'Fragrant Garlic & Egg Fried Rice', Quantity: 1, Price: 45, SubTotal: 45 },
      { P_Code: 'DK-01', Product_Name: 'Coca-Cola Regular 8oz Bottle', Quantity: 1, Price: 35, SubTotal: 35 },
    ],
  },
  {
    Order_No: 'ORD-1091',
    Date_Time: '2026-10-02 12:30:22',
    Total_Qty: 2,
    Total_Amount: 310,
    Order_Type: 'Takeout',
    Payment_Method: 'GCash / QR',
    Customer_Name: 'Elena Ramos',
    Status: 'Completed',
    Items: [
      { P_Code: 'KY-02', Product_Name: 'Backribs', Quantity: 1, Price: 160, SubTotal: 160 },
      { P_Code: 'BS-01', Product_Name: 'Batchoy Special', Quantity: 1, Price: 150, SubTotal: 150 },
    ],
  },
  {
    Order_No: 'ORD-1090',
    Date_Time: '2026-10-02 12:15:05',
    Total_Qty: 4,
    Total_Amount: 439,
    Order_Type: 'Dine-In',
    Payment_Method: 'Cash',
    Customer_Name: 'Table 01 - David',
    Status: 'Completed',
    Items: [
      { P_Code: 'KY-08', Product_Name: 'Crispy Fried Chicken Inasal with Rice', Quantity: 2, Price: 85, SubTotal: 170 },
      { P_Code: 'KY-07', Product_Name: 'Creamy Chicken Ala King', Quantity: 2, Price: 99, SubTotal: 198 },
      { P_Code: 'DK-01', Product_Name: 'Coca-Cola Regular 8oz Bottle', Quantity: 2, Price: 35, SubTotal: 70 },
    ],
  },
  {
    Order_No: 'ORD-1089',
    Date_Time: '2026-10-02 11:55:18',
    Total_Qty: 1,
    Total_Amount: 185,
    Order_Type: 'Dine-In',
    Payment_Method: 'Card',
    Customer_Name: 'Table 05 - Sarah L.',
    Status: 'Completed',
    Items: [
      { P_Code: 'SIG-02', Product_Name: 'Sizzling Sisig Pork Meal with Rice & Egg', Quantity: 1, Price: 185, SubTotal: 185 },
    ],
  },
];

const INITIAL_STOCK_LOGS: StockLog[] = [
  { Sin_ID: 101, Date_time: '2026-10-01 08:30:00', Product_code: 'KY-04', P_name: 'Crispy Sizzling Pork Sisig Solo', Quantity: 50, Cost_Price: 85, Supplier: 'Fresh Meats Metro' },
  { Sin_ID: 102, Date_time: '2026-10-01 08:45:00', Product_code: 'KY-08', P_name: 'Crispy Fried Chicken Inasal with Rice', Quantity: 40, Cost_Price: 48, Supplier: 'Bacolod Poultry Supply' },
  { Sin_ID: 103, Date_time: '2026-10-01 09:00:00', Product_code: 'DK-01', P_name: 'Coca-Cola Regular 8oz Bottle', Quantity: 120, Cost_Price: 18, Supplier: 'Metro Beverages Inc.' },
  { Sin_ID: 104, Date_time: '2026-10-01 09:15:00', Product_code: 'BS-01', P_name: 'Batchoy Special', Quantity: 35, Cost_Price: 80, Supplier: 'Iloilo Noodle Craft' },
  { Sin_ID: 105, Date_time: '2026-10-02 08:00:00', Product_code: 'KY-01', P_name: 'Chori Sandwich', Quantity: 30, Cost_Price: 110, Supplier: 'Artisan Bakery Hub' },
];

const INITIAL_ACCOUNTS: StaffAccount[] = [
  { ACC_ID: 1, Acc_Name: 'Kyle Administrator', User_ID: 'admin', Role: 'Admin', Date_Time: '2026-09-01 09:00:00' },
  { ACC_ID: 2, Acc_Name: 'Supervisor Mark', User_ID: 'manager', Role: 'Manager', Date_Time: '2026-09-05 14:15:00' },
  { ACC_ID: 3, Acc_Name: 'Front Cashier Joy', User_ID: 'cashier1', Role: 'Cashier', Date_Time: '2026-09-10 08:20:00' },
];

const CATEGORIES_LIST = [
  { value: 'all', label: 'All Categories' },
  { value: 'sizzling', label: 'Sizzling & Mains' },
  { value: 'inasal', label: 'Inasal' },
  { value: 'batchoy', label: 'Batchoy Specials' },
  { value: 'sandwiches', label: 'Sandwiches' },
  { value: 'appetizers', label: 'Appetizers' },
  { value: 'rice', label: 'Rice & Sides' },
  { value: 'drinks', label: 'Drinks & Shakes' },
  { value: 'others', label: 'Others' },
];

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation tab: products | reports | transactions | stockin | settings
  const tabParam = searchParams.get('tab') || 'products';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  // Submenu state
  const [isTxSubmenuOpen, setIsTxSubmenuOpen] = useState(false);
  const [txFilterType, setTxFilterType] = useState<'all' | 'sales' | 'purchase'>('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // State data
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<SalesRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);

  // Form states for Add / Edit product
  const [pCode, setPCode] = useState('');
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('sizzling');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stock In Form
  const [stockInProductCode, setStockInProductCode] = useState('');
  const [stockInQty, setStockInQty] = useState('');
  const [stockInCost, setStockInCost] = useState('');
  const [stockInSupplier, setStockInSupplier] = useState('');

  // Account Form
  const [newAccName, setNewAccName] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Manager' | 'Cashier'>('Cashier');

  // Live Philippine / Local Clock
  const [clockTime, setClockTime] = useState('');
  const [clockDate, setClockDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
      if (tabParam === 'transactions' || tabParam === 'stockin') {
        setIsTxSubmenuOpen(true);
      }
    }
  }, [tabParam]);

  // Load persisted or initial data
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('kyleseatery_products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(INITIAL_PRODUCTS);
        localStorage.setItem('kyleseatery_products', JSON.stringify(INITIAL_PRODUCTS));
      }

      const storedSales = localStorage.getItem('kyleseatery_sales');
      if (storedSales) {
        setSalesRecords(JSON.parse(storedSales));
      } else {
        setSalesRecords(INITIAL_SALES);
        localStorage.setItem('kyleseatery_sales', JSON.stringify(INITIAL_SALES));
      }

      const storedStock = localStorage.getItem('kyleseatery_stock');
      if (storedStock) {
        setStockLogs(JSON.parse(storedStock));
      } else {
        setStockLogs(INITIAL_STOCK_LOGS);
        localStorage.setItem('kyleseatery_stock', JSON.stringify(INITIAL_STOCK_LOGS));
      }

      const storedAccounts = localStorage.getItem('kyleseatery_accounts');
      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        setAccounts(INITIAL_ACCOUNTS);
        localStorage.setItem('kyleseatery_accounts', JSON.stringify(INITIAL_ACCOUNTS));
      }
    } catch {
      setProducts(INITIAL_PRODUCTS);
      setSalesRecords(INITIAL_SALES);
      setStockLogs(INITIAL_STOCK_LOGS);
      setAccounts(INITIAL_ACCOUNTS);
    }
  }, []);

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setClockDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save changes to localStorage helper
  const saveProducts = (updated: AdminProduct[]) => {
    setProducts(updated);
    try {
      localStorage.setItem('kyleseatery_products', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
    }
  };

  // Add Product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!pCode.trim() || !pName.trim() || !sellingPrice || !purchasePrice) {
      setFormError('Please fill out all required fields.');
      setSubmitting(false);
      return;
    }

    if (products.some((p) => p.Product_code.toLowerCase() === pCode.trim().toLowerCase())) {
      setFormError(`Product code "${pCode.trim()}" already exists.`);
      setSubmitting(false);
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newProd: AdminProduct = {
      P_code: Date.now(),
      Product_code: pCode.trim().toUpperCase(),
      P_name: pName.trim(),
      P_Category: pCategory,
      P_S_P: parseFloat(sellingPrice),
      P_P_P: parseFloat(purchasePrice),
      P_image: imageUrl || (imageFile ? URL.createObjectURL(imageFile) : null),
      Date_time: nowStr,
      is_available: true,
    };

    const updated = [newProd, ...products];
    saveProducts(updated);

    // Reset Form
    setPCode('');
    setPName('');
    setPCategory('sizzling');
    setSellingPrice('');
    setPurchasePrice('');
    setImageUrl('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowAddModal(false);
    setSubmitting(false);
  };

  // Open Edit Modal
  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setPCode(p.Product_code);
    setPName(p.P_name);
    setPCategory(p.P_Category);
    setSellingPrice(p.P_S_P.toString());
    setPurchasePrice(p.P_P_P.toString());
    setImageUrl(p.P_image || '');
    setFormError('');
    setShowEditModal(true);
  };

  // Save Edited Product
  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError('');

    const updated = products.map((p) => {
      if (p.P_code === editingProduct.P_code) {
        return {
          ...p,
          Product_code: pCode.trim().toUpperCase(),
          P_name: pName.trim(),
          P_Category: pCategory,
          P_S_P: parseFloat(sellingPrice) || p.P_S_P,
          P_P_P: parseFloat(purchasePrice) || p.P_P_P,
          P_image: imageUrl || p.P_image,
        };
      }
      return p;
    });

    saveProducts(updated);
    setShowEditModal(false);
    setEditingProduct(null);
  };

  // Delete Product
  const handleDeleteProduct = (pCodeNum: number, pNameStr: string) => {
    if (confirm(`Are you sure you want to delete product "${pNameStr}"?`)) {
      const updated = products.filter((p) => p.P_code !== pCodeNum);
      saveProducts(updated);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = (pCodeNum: number) => {
    const updated = products.map((p) =>
      p.P_code === pCodeNum ? { ...p, is_available: !p.is_available } : p
    );
    saveProducts(updated);
  };

  // Add Stock In
  const handleAddStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = products.find((p) => p.Product_code === stockInProductCode);
    if (!targetProd) return;

    const newLog: StockLog = {
      Sin_ID: Date.now(),
      Date_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      Product_code: targetProd.Product_code,
      P_name: targetProd.P_name,
      Quantity: parseInt(stockInQty) || 1,
      Cost_Price: parseFloat(stockInCost) || targetProd.P_P_P,
      Supplier: stockInSupplier.trim() || 'Central Commissary',
    };

    const updated = [newLog, ...stockLogs];
    setStockLogs(updated);
    try {
      localStorage.setItem('kyleseatery_stock', JSON.stringify(updated));
    } catch {}

    setStockInProductCode('');
    setStockInQty('');
    setStockInCost('');
    setStockInSupplier('');
    setShowStockInModal(false);
  };

  // Add User Account
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newUserId.trim()) return;

    const newAcc: StaffAccount = {
      ACC_ID: Date.now(),
      Acc_Name: newAccName.trim(),
      User_ID: newUserId.trim().toLowerCase(),
      Role: newRole,
      Date_Time: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    try {
      localStorage.setItem('kyleseatery_accounts', JSON.stringify(updated));
    } catch {}

    setNewAccName('');
    setNewUserId('');
    setShowAccountModal(false);
  };

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      p.Product_code.toLowerCase().includes(term) ||
      p.P_name.toLowerCase().includes(term) ||
      p.P_Category.toLowerCase().includes(term);
    const matchesCategory =
      selectedCategory === 'all' || p.P_Category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Reports KPI Metrics
  const totalRevenue = salesRecords.reduce((sum, s) => sum + s.Total_Amount, 0);
  const totalOrdersCount = salesRecords.length;
  const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const totalItemsSold = salesRecords.reduce((sum, s) => sum + s.Total_Qty, 0);

  return (
    <div className="admin-page-container">
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        precedence="default"
      />
      {/* ── Topbar (exactly matching admin ui sample with restaurant name: kyleseatery) ── */}
      <header className="topbar">
        {/* Brand logo and name */}
        <div className="topbar-brand">
          <i className="ti ti-flame topbar-brand-icon"></i>
          <span className="topbar-brand-name">kyleseatery</span>
        </div>

        {/* Search */}
        <div className="topbar-search">
          <i className="ti ti-search topbar-search-icon"></i>
          <input
            type="text"
            placeholder="Search products, records, or orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="topbar-search-input"
          />
        </div>

        {/* Right side controls */}
        <div className="topbar-right">
          {/* Quick link to Customer Menu */}
          <Link
            href="/"
            className="topbar-icon-btn"
            title="Open Customer Table Menu"
            target="_blank"
          >
            <i className="ti ti-external-link"></i>
          </Link>

          <button
            className="topbar-icon-btn"
            aria-label="Notifications"
            onClick={() => alert('kyleseatery Admin: All systems active and synchronized.')}
          >
            <i className="ti ti-bell"></i>
          </button>

          <div
            className="topbar-user"
            onClick={() => handleNav('settings')}
            title="Administrator Settings"
          >
            <div className="topbar-avatar">K</div>
            <span className="topbar-username">Admin</span>
            <i className="ti ti-chevron-down topbar-chevron"></i>
          </div>
        </div>
      </header>

      {/* ── Sidebar (matching admin ui sample navigation) ── */}
      <aside className="sidebar">
        <ul>
          {/* Reports */}
          <li
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => handleNav('reports')}
          >
            <i className="ti ti-chart-bar"></i>
            Reports
          </li>

          {/* Products (Masterlist) */}
          <li
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => handleNav('products')}
          >
            <i className="ti ti-burger"></i>
            Products
          </li>

          {/* Transactions (with submenu) */}
          <li className="has-submenu">
            <div
              className={`submenu-header ${
                activeTab === 'transactions' || activeTab === 'stockin' ? 'active' : ''
              }`}
              onClick={() => {
                handleNav('transactions');
                setTxFilterType('all');
              }}
            >
              <i className="ti ti-receipt"></i>
              Transactions
              <i
                className={`ti ti-chevron-${isTxSubmenuOpen ? 'up' : 'down'}`}
                style={{ marginLeft: 'auto', fontSize: '12px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTxSubmenuOpen(!isTxSubmenuOpen);
                }}
              ></i>
            </div>
            {isTxSubmenuOpen && (
              <ul className="submenu-list">
                <li
                  className={
                    activeTab === 'transactions' && txFilterType === 'all'
                      ? 'submenu-active'
                      : ''
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('transactions');
                    setTxFilterType('all');
                  }}
                >
                  <i className="ti ti-point" style={{ fontSize: '10px' }}></i>
                  All Transactions
                </li>
                <li
                  className={
                    activeTab === 'transactions' && txFilterType === 'sales'
                      ? 'submenu-active'
                      : ''
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('transactions');
                    setTxFilterType('sales');
                  }}
                >
                  <i className="ti ti-point" style={{ fontSize: '10px' }}></i>
                  Sales Order
                </li>
                <li
                  className={activeTab === 'stockin' ? 'submenu-active' : ''}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNav('stockin');
                  }}
                >
                  <i className="ti ti-point" style={{ fontSize: '10px' }}></i>
                  Purchase Order
                </li>
              </ul>
            )}
          </li>

          {/* Settings */}
          <li
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => handleNav('settings')}
          >
            <i className="ti ti-settings"></i>
            Settings
          </li>

          {/* POS & Operations Section Divider */}
          <li
            style={{
              padding: '16px 20px 4px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--text-muted)',
              cursor: 'default',
              fontWeight: 700,
            }}
          >
            Operations
          </li>

          {/* Cashier Terminal */}
          <li onClick={() => router.push('/pos')}>
            <i className="ti ti-device-ipad"></i>
            Cashier POS
          </li>

          {/* Live Orders Tracker */}
          <li onClick={() => router.push('/orders')}>
            <i className="ti ti-clipboard-list"></i>
            Orders Tracker
          </li>

          {/* Customer Table Menu */}
          <li onClick={() => router.push('/')}>
            <i className="ti ti-shopping-bag"></i>
            Customer Menu
          </li>

          {/* Kitchen KDS */}
          <li onClick={() => router.push('/pos')}>
            <i className="ti ti-tools-kitchen-2"></i>
            Kitchen KDS
          </li>

          {/* Logout */}
          <li
            className="logout-item"
            onClick={() => {
              if (confirm('Sign out from kyleseatery admin panel?')) {
                router.push('/');
              }
            }}
          >
            <i className="ti ti-logout"></i>
            Logout
          </li>
        </ul>

        {/* User Profile Badge */}
        <div className="user-profile-badge">
          <div className="avatar">K</div>
          <div className="info">
            <div className="name">kyleseatery Admin</div>
            <div className="role">Administrator</div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content">
        {/* ==================================================================== */}
        {/* TAB 1: PRODUCTS / MASTERLIST (Default Admin Page)                     */}
        {/* ==================================================================== */}
        {activeTab === 'products' && (
          <div>
            {/* Header Actions */}
            <div className="header-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h1 style={{ margin: 0 }}>Products Masterlist</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List View"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: viewMode === 'list' ? 'rgba(234, 106, 18, 0.1)' : 'transparent',
                      border:
                        viewMode === 'list'
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border)',
                      color: viewMode === 'list' ? 'var(--primary)' : '#adb5bd',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      fontSize: '18px',
                    }}
                  >
                    <i className="ti ti-list"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: viewMode === 'grid' ? 'rgba(234, 106, 18, 0.1)' : 'transparent',
                      border:
                        viewMode === 'grid'
                          ? '1px solid var(--primary)'
                          : '1px solid var(--border)',
                      color: viewMode === 'grid' ? 'var(--primary)' : '#adb5bd',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      fontSize: '18px',
                    }}
                  >
                    <i className="ti ti-layout-grid"></i>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="add-new-btn"
                  onClick={() => {
                    setFormError('');
                    setShowAddModal(true);
                  }}
                >
                  <i className="ti ti-plus" style={{ fontSize: '16px' }}></i> Add new product
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '25px',
              }}
            >
              {CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: 'none',
                    background:
                      selectedCategory === cat.value ? 'rgba(234, 106, 18, 0.1)' : '#ffffff',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor:
                      selectedCategory === cat.value ? 'var(--primary)' : 'var(--border)',
                    color: selectedCategory === cat.value ? 'var(--primary)' : '#5c636a',
                    fontSize: '13px',
                    fontWeight: selectedCategory === cat.value ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List / Table View */}
            {filteredProducts.length === 0 ? (
              <div
                className="table-wrapper"
                style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}
              >
                <i
                  className="ti ti-package-off"
                  style={{
                    fontSize: '52px',
                    color: 'var(--primary)',
                    marginBottom: '15px',
                    display: 'block',
                  }}
                ></i>
                <h3 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>
                  No products found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  No menu dishes match &ldquo;{searchQuery}&rdquo;. Try another filter or add a new
                  product.
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Image</th>
                      <th>Product Code</th>
                      <th>Dish Name</th>
                      <th>Category</th>
                      <th>Selling Price</th>
                      <th>Purchase Price</th>
                      <th>Status</th>
                      <th>Date Added</th>
                      <th style={{ textAlign: 'center', width: '130px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.P_code}>
                        <td>
                          {p.P_image ? (
                            <img
                              src={p.P_image.startsWith('/') ? p.P_image : `/${p.P_image}`}
                              alt={p.P_name}
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                setPreviewImage({
                                  src: p.P_image?.startsWith('/') ? p.P_image : `/${p.P_image}`,
                                  name: p.P_name,
                                })
                              }
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/finallogo.png';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                background: '#fff4eb',
                                border: '1px solid #ffd8be',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: 'var(--primary)',
                              }}
                            >
                              🍔
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            color: 'var(--text-dark)',
                          }}
                        >
                          {p.Product_code}
                        </td>
                        <td style={{ color: 'var(--text-dark)', fontWeight: '600' }}>{p.P_name}</td>
                        <td>
                          <span
                            className="badge badge-role"
                            style={{ textTransform: 'capitalize' }}
                          >
                            {p.P_Category}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: '700',
                            color: 'var(--primary)',
                            fontSize: '15px',
                          }}
                        >
                          ₱{Number(p.P_S_P).toFixed(2)}
                        </td>
                        <td style={{ color: 'var(--success)', fontWeight: '600' }}>
                          ₱{Number(p.P_P_P).toFixed(2)}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleAvailability(p.P_code)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background:
                                p.is_available !== false
                                  ? 'rgba(40, 167, 69, 0.15)'
                                  : 'rgba(220, 53, 69, 0.15)',
                              color: p.is_available !== false ? '#28a745' : '#dc3545',
                              transition: 'var(--transition)',
                            }}
                          >
                            {p.is_available !== false ? '● In Stock' : '○ Out of Stock'}
                          </button>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {p.Date_time.split(' ')[0]}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: '8px',
                            }}
                          >
                            <button
                              className="info-btn"
                              style={{
                                padding: '6px 10px',
                                fontSize: '13px',
                                borderRadius: '8px',
                              }}
                              onClick={() => openEditModal(p)}
                              title="Edit product"
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button
                              className="danger-btn"
                              style={{
                                padding: '6px 10px',
                                fontSize: '13px',
                                borderRadius: '8px',
                              }}
                              onClick={() => handleDeleteProduct(p.P_code, p.P_name)}
                              title="Delete product"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid Cards Layout */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '22px',
                  paddingBottom: '40px',
                }}
              >
                {filteredProducts.map((p) => (
                  <div
                    key={p.P_code}
                    className="stat-card"
                    style={{
                      textAlign: 'left',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Image / Icon container */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '140px',
                        borderRadius: '12px',
                        background: '#f8f9fa',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {p.P_image ? (
                        <img
                          src={p.P_image.startsWith('/') ? p.P_image : `/${p.P_image}`}
                          alt={p.P_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/finallogo.png';
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '48px' }}>🍔</div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background:
                            p.is_available !== false ? 'rgba(0, 0, 0, 0.7)' : 'rgba(220,53,69,0.9)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {p.is_available !== false ? 'IN STOCK' : 'OUT OF STOCK'}
                      </span>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          className="badge badge-role"
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {p.P_Category}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                          }}
                        >
                          {p.Product_code}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: 'var(--text-dark)',
                          marginTop: '6px',
                          lineHeight: '1.3',
                        }}
                      >
                        {p.P_name}
                      </h3>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          marginTop: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Selling Price:</span>
                          <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                            ₱{Number(p.P_S_P).toFixed(2)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Cost Price:</span>
                          <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                            ₱{Number(p.P_P_P).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action footer */}
                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        className="info-btn"
                        style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }}
                        onClick={() => openEditModal(p)}
                      >
                        <i className="ti ti-edit"></i> Edit
                      </button>
                      <button
                        className="danger-btn"
                        style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px' }}
                        onClick={() => handleDeleteProduct(p.P_code, p.P_name)}
                      >
                        <i className="ti ti-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: REPORTS & ANALYTICS                                           */}
        {/* ==================================================================== */}
        {activeTab === 'reports' && (
          <div>
            <div className="header-actions">
              <div>
                <h1 style={{ margin: 0 }}>Sales & Analytics Reports</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Overview of restaurant sales, order trends, and payment reconciliations.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="report-action-btn"
                  onClick={() => window.print()}
                  title="Print Reports"
                >
                  <i className="ti ti-printer"></i> Print Report
                </button>
                <button
                  className="add-new-btn"
                  onClick={() => alert('Sales report data exported to CSV successfully.')}
                >
                  <i className="ti ti-download"></i> Export CSV
                </button>
              </div>
            </div>

            {/* Summary Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '30px',
              }}
            >
              <div className="stat-card">
                <i
                  className="ti ti-cash"
                  style={{ fontSize: '28px', color: 'var(--primary)', marginBottom: '8px' }}
                ></i>
                <h3>Total Sales Revenue</h3>
                <p
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    marginTop: '6px',
                  }}
                >
                  ₱{totalRevenue.toFixed(2)}
                </p>
              </div>

              <div className="stat-card">
                <i
                  className="ti ti-receipt"
                  style={{ fontSize: '28px', color: '#02a488', marginBottom: '8px' }}
                ></i>
                <h3>Completed Orders</h3>
                <p
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#02a488',
                    marginTop: '6px',
                  }}
                >
                  {totalOrdersCount}
                </p>
              </div>

              <div className="stat-card">
                <i
                  className="ti ti-scale"
                  style={{ fontSize: '28px', color: '#17a2b8', marginBottom: '8px' }}
                ></i>
                <h3>Average Ticket Size</h3>
                <p
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#17a2b8',
                    marginTop: '6px',
                  }}
                >
                  ₱{avgTicket.toFixed(2)}
                </p>
              </div>

              <div className="stat-card">
                <i
                  className="ti ti-tools-kitchen-2"
                  style={{ fontSize: '28px', color: '#fd7e14', marginBottom: '8px' }}
                ></i>
                <h3>Total Dishes Served</h3>
                <p
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#fd7e14',
                    marginTop: '6px',
                  }}
                >
                  {totalItemsSold} Items
                </p>
              </div>
            </div>

            {/* Sales Orders History Table */}
            <div className="table-wrapper">
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                  }}
                >
                  Recent Sales Receipts & Orders
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Total {salesRecords.length} records recorded
                </span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Date & Time</th>
                    <th>Customer / Table</th>
                    <th>Order Type</th>
                    <th>Payment Method</th>
                    <th>Items Qty</th>
                    <th>Total Paid</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Official Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRecords.map((sale) => (
                    <tr key={sale.Order_No}>
                      <td
                        style={{
                          fontWeight: '700',
                          fontFamily: 'monospace',
                          color: 'var(--text-dark)',
                        }}
                      >
                        {sale.Order_No}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {sale.Date_Time}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                        {sale.Customer_Name}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sale.Order_Type === 'Dine-In' ? 'badge-dinein' : 'badge-takeout'
                          }`}
                        >
                          {sale.Order_Type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sale.Payment_Method === 'Cash'
                              ? 'badge-cash'
                              : sale.Payment_Method === 'Card'
                              ? 'badge-card'
                              : 'badge-qrs'
                          }`}
                        >
                          {sale.Payment_Method}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{sale.Total_Qty} items</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: 'var(--primary)',
                          fontSize: '15px',
                        }}
                      >
                        ₱{sale.Total_Amount.toFixed(2)}
                      </td>
                      <td>
                        <span className="badge badge-stockin">{sale.Status}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="report-action-btn"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => setReceiptOrder(sale)}
                        >
                          <i className="ti ti-receipt"></i> View OR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TRANSACTIONS & STOCK IN LOGS                                  */}
        {/* ==================================================================== */}
        {(activeTab === 'transactions' || activeTab === 'stockin') && (
          <div>
            <div className="header-actions">
              <div>
                <h1 style={{ margin: 0 }}>
                  {activeTab === 'stockin'
                    ? 'Purchase Orders & Stock Logs'
                    : 'Inventory Transactions & Sales'}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Complete audit trail of sales orders, stock replenishment, and supply receipts.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="add-new-btn" onClick={() => setShowStockInModal(true)}>
                  <i className="ti ti-plus"></i> New Purchase Order
                </button>
              </div>
            </div>

            {/* Sub-tabs for filter */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <button
                onClick={() => setTxFilterType('all')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: txFilterType === 'all' ? 'var(--primary)' : '#fff',
                  color: txFilterType === 'all' ? '#fff' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                All Transactions
              </button>
              <button
                onClick={() => setTxFilterType('sales')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: txFilterType === 'sales' ? 'var(--primary)' : '#fff',
                  color: txFilterType === 'sales' ? '#fff' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                Sales Orders ({salesRecords.length})
              </button>
              <button
                onClick={() => setTxFilterType('purchase')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: txFilterType === 'purchase' ? 'var(--primary)' : '#fff',
                  color: txFilterType === 'purchase' ? '#fff' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                Purchase Orders ({stockLogs.length})
              </button>
            </div>

            {/* Transactions Table */}
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ref / Order ID</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Item Description</th>
                    <th>Quantity</th>
                    <th>Unit Price / Cost</th>
                    <th>Subtotal</th>
                    <th>Source / Method</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Stock Logs (Purchases) */}
                  {(txFilterType === 'all' || txFilterType === 'purchase') &&
                    stockLogs.map((log) => (
                      <tr key={`purchase-${log.Sin_ID}`}>
                        <td
                          style={{
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            color: 'var(--text-dark)',
                          }}
                        >
                          #PO-{log.Sin_ID}
                        </td>
                        <td>
                          <span className="badge badge-stockin">Purchase</span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {log.Date_time}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                          {log.P_name}{' '}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ({log.Product_code})
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#28a745' }}>+{log.Quantity}</td>
                        <td style={{ color: 'var(--text-main)' }}>
                          ₱{log.Cost_Price.toFixed(2)} cost
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                          ₱{(log.Quantity * log.Cost_Price).toFixed(2)}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {log.Supplier}
                        </td>
                      </tr>
                    ))}

                  {/* Sales Records */}
                  {(txFilterType === 'all' || txFilterType === 'sales') &&
                    salesRecords.map((sale) => (
                      <tr key={`sales-${sale.Order_No}`}>
                        <td
                          style={{
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            color: 'var(--text-dark)',
                          }}
                        >
                          #{sale.Order_No}
                        </td>
                        <td>
                          <span className="badge badge-cash">Sales</span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {sale.Date_Time}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                          {sale.Items.map((i) => `${i.Product_Name} (×${i.Quantity})`).join(', ')}
                        </td>
                        <td style={{ fontWeight: 700, color: '#dc3545' }}>-{sale.Total_Qty}</td>
                        <td style={{ color: 'var(--text-main)' }}>Ticket Total</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          ₱{sale.Total_Amount.toFixed(2)}
                        </td>
                        <td>
                          <span className="badge badge-role">{sale.Payment_Method}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: SETTINGS & ACCOUNTS                                           */}
        {/* ==================================================================== */}
        {activeTab === 'settings' && (
          <div>
            <div className="header-actions">
              <div>
                <h1 style={{ margin: 0 }}>System Settings & Accounts</h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Manage kyleseatery restaurant configuration, operating schedule, and staff
                  credentials.
                </p>
              </div>

              <button className="add-new-btn" onClick={() => setShowAccountModal(true)}>
                <i className="ti ti-user-plus"></i> Add Staff Account
              </button>
            </div>

            {/* Restaurant Profile Card & Live Clock */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '35px',
              }}
            >
              {/* Profile Card */}
              <div
                className="stat-card"
                style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(234, 106, 18, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      fontSize: '24px',
                    }}
                  >
                    <i className="ti ti-flame"></i>
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                      }}
                    >
                      kyleseatery
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      Point of Sale & Admin Terminal
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Schedule Brand (Mon-Sat):</span>
                    <strong style={{ color: 'var(--text-dark)' }}>Kyle&apos;s Eatery</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Schedule Brand (Sunday):</span>
                    <strong style={{ color: 'var(--text-dark)' }}>Batchoy Shop</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Currency System:</span>
                    <strong style={{ color: 'var(--success)' }}>Philippine Peso (₱ PHP)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>System Version:</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      v2.4.0 Next.js
                    </span>
                  </div>
                </div>
              </div>

              {/* Philippine Time Clock */}
              <div
                className="stat-card"
                style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Philippine Standard Time (PST)
                </span>
                <div
                  style={{
                    fontSize: '38px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: 'var(--primary)',
                    letterSpacing: '2px',
                  }}
                >
                  {clockTime || '--:--:--'}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>
                  {clockDate || 'Loading date...'}
                </div>
                <span
                  className="badge badge-stockin"
                  style={{ marginTop: '6px', fontSize: '11px' }}
                >
                  ● System Synced Live
                </span>
              </div>
            </div>

            {/* Accounts Table */}
            <div className="table-wrapper">
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                  }}
                >
                  Staff Accounts & Permissions
                </h3>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Account ID</th>
                    <th>Staff Name</th>
                    <th>User ID / Username</th>
                    <th>Assigned Role</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.ACC_ID}>
                      <td
                        style={{
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color: 'var(--text-dark)',
                        }}
                      >
                        #{acc.ACC_ID}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{acc.Acc_Name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                        @{acc.User_ID}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            acc.Role === 'Admin'
                              ? 'badge-role'
                              : acc.Role === 'Manager'
                              ? 'badge-card'
                              : 'badge-cash'
                          }`}
                        >
                          {acc.Role}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {acc.Date_Time}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="danger-btn"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            if (acc.Role === 'Admin') {
                              alert('Cannot remove the primary Administrator account.');
                              return;
                            }
                            if (confirm(`Remove staff account @${acc.User_ID}?`)) {
                              const updated = accounts.filter((a) => a.ACC_ID !== acc.ACC_ID);
                              setAccounts(updated);
                              try {
                                localStorage.setItem(
                                  'kyleseatery_accounts',
                                  JSON.stringify(updated)
                                );
                              } catch {}
                            }
                          }}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: ADD PRODUCT MODAL                                           */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            style={{ width: '550px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowAddModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3
              style={{
                marginBottom: '20px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '22px',
                color: 'var(--primary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                fontWeight: 700,
              }}
            >
              Add New Product to kyleseatery
            </h3>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(220,53,69,0.1)',
                  border: '1px solid rgba(220,53,69,0.2)',
                  color: '#ff4d4d',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '15px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct}>
              <div className="input-group">
                <label>Product Code / SKU</label>
                <input
                  type="text"
                  placeholder="e.g. KY-15"
                  value={pCode}
                  onChange={(e) => setPCode(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Dish / Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sizzling Sisig Pork Meal"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Category</label>
                <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} required>
                  <option value="sizzling">Sizzling & Mains</option>
                  <option value="inasal">Inasal</option>
                  <option value="batchoy">Batchoy Specials</option>
                  <option value="sandwiches">Sandwiches</option>
                  <option value="appetizers">Appetizers</option>
                  <option value="rice">Rice & Sides</option>
                  <option value="drinks">Drinks & Shakes</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Selling Price (₱ PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Cost / Purchase Price (₱ PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Product Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ padding: '8px' }}
                />
              </div>

              <div className="input-group">
                <label>Or Image Path / URL</label>
                <input
                  type="text"
                  placeholder="e.g. uploads/SIG01_Sisig_Pork_Solo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="add-new-btn"
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                }}
                disabled={submitting}
              >
                {submitting ? 'SAVING PRODUCT...' : 'SAVE PRODUCT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: EDIT PRODUCT MODAL                                          */}
      {/* ==================================================================== */}
      {showEditModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content"
            style={{ width: '550px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowEditModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3
              style={{
                marginBottom: '20px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '22px',
                color: 'var(--primary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                fontWeight: 700,
              }}
            >
              Edit Product Details
            </h3>

            <form onSubmit={handleEditProduct}>
              <div className="input-group">
                <label>Product Code</label>
                <input
                  type="text"
                  value={pCode}
                  onChange={(e) => setPCode(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Dish / Product Name</label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Category</label>
                <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} required>
                  <option value="sizzling">Sizzling & Mains</option>
                  <option value="inasal">Inasal</option>
                  <option value="batchoy">Batchoy Specials</option>
                  <option value="sandwiches">Sandwiches</option>
                  <option value="appetizers">Appetizers</option>
                  <option value="rice">Rice & Sides</option>
                  <option value="drinks">Drinks & Shakes</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Selling Price (₱ PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Cost / Purchase Price (₱ PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Image URL / Path</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. uploads/SIG01_Sisig_Pork_Solo.jpg"
                />
              </div>

              <button
                type="submit"
                className="add-new-btn"
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                UPDATE PRODUCT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: OFFICIAL RECEIPT (OR) MODAL                                 */}
      {/* ==================================================================== */}
      {receiptOrder && (
        <div className="modal-overlay" onClick={() => setReceiptOrder(null)}>
          <div
            className="modal-content"
            style={{ width: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setReceiptOrder(null)}>
              <i className="ti ti-x"></i>
            </button>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--primary)',
                  fontSize: '22px',
                  fontWeight: 800,
                }}
              >
                <i className="ti ti-flame"></i> kyleseatery
              </div>
              <p
                style={{
                  fontSize: '11px',
                  letterSpacing: '1px',
                  color: 'var(--text-muted)',
                  marginTop: '3px',
                }}
              >
                OFFICIAL SALES RECEIPT
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Mon-Sat Kyle&apos;s Eatery • Sun Batchoy Shop
              </p>
            </div>

            <div
              style={{
                borderTop: '1px dashed var(--border)',
                borderBottom: '1px dashed var(--border)',
                padding: '12px 0',
                marginBottom: '15px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Number:</span>
                <strong style={{ fontFamily: 'monospace' }}>{receiptOrder.Order_No}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span>{receiptOrder.Date_Time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <span>{receiptOrder.Customer_Name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Type & Payment:</span>
                <span>
                  {receiptOrder.Order_Type} • {receiptOrder.Payment_Method}
                </span>
              </div>
            </div>

            {/* Receipt Items */}
            <div style={{ marginBottom: '15px' }}>
              <table style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 0' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '6px 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptOrder.Items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted var(--border)' }}>
                      <td style={{ padding: '8px 0', color: 'var(--text-dark)' }}>
                        {item.Product_Name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.Quantity}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0' }}>
                        ₱{item.Price.toFixed(2)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          padding: '8px 0',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                        }}
                      >
                        ₱{item.SubTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div
              style={{
                borderTop: '2px solid var(--border)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '20px',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)' }}>
                TOTAL AMOUNT PAID:
              </span>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: 'monospace',
                }}
              >
                ₱{receiptOrder.Total_Amount.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="add-new-btn"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => window.print()}
              >
                <i className="ti ti-printer"></i> Print Receipt
              </button>
              <button
                className="report-action-btn"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => setReceiptOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: STOCK IN / PURCHASE ORDER MODAL                             */}
      {/* ==================================================================== */}
      {showStockInModal && (
        <div className="modal-overlay" onClick={() => setShowStockInModal(false)}>
          <div
            className="modal-content"
            style={{ width: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowStockInModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3
              style={{
                marginBottom: '20px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '22px',
                color: 'var(--primary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                fontWeight: 700,
              }}
            >
              New Purchase Order (Stock In)
            </h3>

            <form onSubmit={handleAddStockIn}>
              <div className="input-group">
                <label>Select Product to Restock</label>
                <select
                  value={stockInProductCode}
                  onChange={(e) => {
                    setStockInProductCode(e.target.value);
                    const prod = products.find((p) => p.Product_code === e.target.value);
                    if (prod) setStockInCost(prod.P_P_P.toString());
                  }}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.P_code} value={p.Product_code}>
                      {p.Product_code} - {p.P_name} (Cost: ₱{p.P_P_P})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Quantity In</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={stockInQty}
                    onChange={(e) => setStockInQty(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Unit Cost (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={stockInCost}
                    onChange={(e) => setStockInCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Supplier / Source</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Food Commissary"
                  value={stockInSupplier}
                  onChange={(e) => setStockInSupplier(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="add-new-btn"
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                RECORD PURCHASE ORDER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: ADD STAFF ACCOUNT MODAL                                     */}
      {/* ==================================================================== */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div
            className="modal-content"
            style={{ width: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setShowAccountModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <h3
              style={{
                marginBottom: '20px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '22px',
                color: 'var(--primary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                fontWeight: 700,
              }}
            >
              Add Staff Account
            </h3>

            <form onSubmit={handleAddAccount}>
              <div className="input-group">
                <label>Full Staff Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Username / Login ID</label>
                <input
                  type="text"
                  placeholder="e.g. cashier2"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Role</label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as 'Admin' | 'Manager' | 'Cashier')
                  }
                  required
                >
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="add-new-btn"
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 700,
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                CREATE STAFF ACCOUNT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: IMAGE PREVIEW MODAL                                         */}
      {/* ==================================================================== */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-content"
            style={{ width: '450px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setPreviewImage(null)}>
              <i className="ti ti-x"></i>
            </button>
            <h3 style={{ marginBottom: '15px', color: 'var(--text-dark)', fontSize: '18px' }}>
              {previewImage.name}
            </h3>
            <img
              src={previewImage.src}
              alt={previewImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: '350px',
                borderRadius: '12px',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg-deep)',
            color: 'var(--primary)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
