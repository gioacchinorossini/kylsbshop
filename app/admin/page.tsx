'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Flame,
  LayoutGrid,
  Receipt,
  Rows3,
  UtensilsCrossed,
  Users,
  Settings,
  CircleHelp,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  SlidersHorizontal,
  User,
  MoreVertical,
  X,
  Timer,
} from 'lucide-react';
import './admin.css';

// ─── Data Types ─────────────────────────────────────────────────────────────
interface Dish {
  id: string;
  name: string;
  category: string;
  tag: string;
  price: number;
  imageUrl: string;
  isSpecial?: boolean;
}

interface OrderLineCard {
  id: string;
  orderNumber: string;
  tableNumber: string;
  itemCount: number;
  timeAgo: string;
  status: 'In Kitchen' | 'Wait List' | 'Ready' | 'Served';
  colorTheme: 'mint' | 'peach' | 'purple' | 'blue';
  orderType: 'Dine in' | 'Wait List' | 'Take Away' | 'Served';
  guestCount: number;
  items: {
    dishId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
}

interface TableReservation {
  id: string;
  time: string;
  name: string;
  table: string;
  guests: number;
  phone?: string;
  tag: string;
  status: 'Payment' | 'On Dine' | 'Free' | 'Unpaid' | 'Paid';
  type: 'All' | 'Reservation' | 'On Dine';
}

interface FloorTable {
  id: string;
  name: string;
  zone: 'Main Dining' | 'Terrace' | 'Outdoor';
  capacity: number;
  status: 'available' | 'reserved' | 'ondine';
}

// ─── Dishes Database matching Tasty Station UI ─────────────────────────────
const INITIAL_DISHES: Dish[] = [
  {
    id: 'd-1',
    name: 'Grilled Salmon Steak',
    category: 'special',
    tag: 'Lunch',
    price: 15.0,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-2',
    name: 'Tofu Poke Bowl',
    category: 'soups',
    tag: 'Salad',
    price: 7.0,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-3',
    name: 'Pasta with Roast Beef',
    category: 'special',
    tag: 'Pasta',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-4',
    name: 'Beef Steak',
    category: 'special',
    tag: 'Beef',
    price: 30.0,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-5',
    name: 'Shrimp Rice Bowl',
    category: 'chickens',
    tag: 'Rice',
    price: 6.0,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-6',
    name: 'Apple Stuffed Pancake',
    category: 'desserts',
    tag: 'Dessert',
    price: 35.0,
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-7',
    name: 'Chicken Quinoa & Herbs',
    category: 'chickens',
    tag: 'Chicken',
    price: 12.0,
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-8',
    name: 'Vegetable Shrimp',
    category: 'soups',
    tag: 'Salad',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
    isSpecial: true,
  },
  {
    id: 'd-9',
    name: 'Cheese Syrniki Pancakes',
    category: 'desserts',
    tag: 'Dessert',
    price: 8.0,
    imageUrl: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-10',
    name: 'Apple Stuffed Pancake',
    category: 'desserts',
    tag: 'Dessert',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-11',
    name: 'Terracotta Bowl',
    category: 'desserts',
    tag: 'Dessert',
    price: 12.0,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-12',
    name: 'Granola Banana & Berry',
    category: 'desserts',
    tag: 'Dessert',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-13',
    name: 'Vanilla Cherry Cupcake',
    category: 'desserts',
    tag: 'Dessert',
    price: 8.0,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-14',
    name: 'Belgian Waffles with Syrup',
    category: 'desserts',
    tag: 'Dessert',
    price: 20.0,
    imageUrl: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-15',
    name: 'Muesli Bowl with Honey',
    category: 'desserts',
    tag: 'Dessert',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-d8a43657cb02?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'd-16',
    name: 'Waffles with Ice-cream',
    category: 'desserts',
    tag: 'Dessert',
    price: 10.0,
    imageUrl: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?auto=format&fit=crop&w=300&q=80',
  },
];

// ─── Order Line Cards matching screenshot ──────────────────────────────────
const INITIAL_ORDER_CARDS: OrderLineCard[] = [
  {
    id: 'ord-27',
    orderNumber: '#F0027',
    tableNumber: 'Table 03',
    itemCount: 8,
    timeAgo: '2 mins ago',
    status: 'In Kitchen',
    colorTheme: 'mint',
    orderType: 'Dine in',
    guestCount: 3,
    items: [
      { dishId: 'd-1', name: 'Grilled Salmon Steak', quantity: 2, price: 15.0 },
      { dishId: 'd-3', name: 'Pasta with Roast Beef', quantity: 3, price: 10.0 },
      { dishId: 'd-5', name: 'Shrimp Rice Bowl', quantity: 2, price: 6.0 },
      { dishId: 'd-8', name: 'Vegetable Shrimp', quantity: 1, price: 10.0 },
    ],
  },
  {
    id: 'ord-28',
    orderNumber: '#F0028',
    tableNumber: 'Table 07',
    itemCount: 3,
    timeAgo: 'Just Now',
    status: 'Wait List',
    colorTheme: 'peach',
    orderType: 'Wait List',
    guestCount: 2,
    items: [
      { dishId: 'd-4', name: 'Beef Steak', quantity: 1, price: 30.0 },
      { dishId: 'd-7', name: 'Chicken Quinoa & Herbs', quantity: 2, price: 12.0 },
    ],
  },
  {
    id: 'ord-19',
    orderNumber: '#F0019',
    tableNumber: 'Table 09',
    itemCount: 2,
    timeAgo: '25 mins ago',
    status: 'Ready',
    colorTheme: 'purple',
    orderType: 'Take Away',
    guestCount: 1,
    items: [
      { dishId: 'd-1', name: 'Grilled Salmon Steak', quantity: 1, price: 15.0 },
      { dishId: 'd-6', name: 'Apple Stuffed Pancake', quantity: 1, price: 35.0 },
    ],
  },
];

// ─── Initial Reservations matching top-left screen ─────────────────────────
const INITIAL_RESERVATIONS: TableReservation[] = [
  {
    id: 'res-1',
    time: '7:30 PM',
    name: 'Uthman ibn Hunaif',
    table: 'Table 1',
    guests: 6,
    phone: '+84 678 890 000',
    tag: 'Dinner',
    status: 'Payment',
    type: 'Reservation',
  },
  {
    id: 'res-2',
    time: 'On Dine',
    name: 'Bashir ibn Sa\'ad',
    table: 'Table 2',
    guests: 2,
    tag: 'On Dine',
    status: 'On Dine',
    type: 'On Dine',
  },
  {
    id: 'res-3',
    time: '8:00 PM',
    name: 'Ali',
    table: 'Table 3',
    guests: 2,
    phone: '+84 342 556 555',
    tag: 'Dinner',
    status: 'Payment',
    type: 'Reservation',
  },
  {
    id: 'res-4',
    time: 'On Dine',
    name: 'Khunais ibn Hudhafa',
    table: 'Table 4',
    guests: 3,
    tag: 'On Dine',
    status: 'On Dine',
    type: 'On Dine',
  },
  {
    id: 'res-5',
    time: 'Free',
    name: 'Available Now',
    table: 'Table 5',
    guests: 0,
    tag: 'Free',
    status: 'Free',
    type: 'All',
  },
  {
    id: 'res-6',
    time: '8:25 PM',
    name: 'Mus\'ab ibn Umayr',
    table: 'Table 6',
    guests: 7,
    phone: '+84 800 563 554',
    tag: 'Dinner',
    status: 'Unpaid',
    type: 'Reservation',
  },
  {
    id: 'res-7',
    time: '9:00 PM',
    name: 'Shuja ibn Wahb',
    table: 'Table 5',
    guests: 10,
    tag: 'Dinner',
    status: 'Paid',
    type: 'Reservation',
  },
];

// ─── Initial Floor Tables matching top-left screen layout ──────────────────
const INITIAL_FLOOR_TABLES: FloorTable[] = [
  { id: 'tbl-1', name: 'Table #1', zone: 'Main Dining', capacity: 6, status: 'available' },
  { id: 'tbl-2', name: 'Table #2', zone: 'Main Dining', capacity: 2, status: 'ondine' },
  { id: 'tbl-3', name: 'Table #3', zone: 'Main Dining', capacity: 2, status: 'available' },
  { id: 'tbl-4', name: 'Table #4', zone: 'Main Dining', capacity: 3, status: 'ondine' },
  { id: 'tbl-5', name: 'Table #5', zone: 'Main Dining', capacity: 0, status: 'reserved' },
  { id: 'tbl-6', name: 'Table #6', zone: 'Main Dining', capacity: 7, status: 'available' },
  { id: 'tbl-7', name: 'Table #7', zone: 'Terrace', capacity: 4, status: 'reserved' },
  { id: 'tbl-8', name: 'Table #8', zone: 'Outdoor', capacity: 4, status: 'available' },
];

function AdminPortalApp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Navigation Screen: 'order-line' | 'manage-table' | 'manage-dishes' | 'dashboard' | 'customers' | 'settings'
  const initialNav = searchParams.get('tab') === 'settings' ? 'settings' : 'order-line';
  const [activeNav, setActiveNav] = useState<string>(initialNav);

  // Search in Top Bar
  const [globalSearch, setGlobalSearch] = useState('');

  // ─── 1. State for ORDER LINE screen ───────────────────────────────────────
  const [activeStatusFilter, setActiveStatusFilter] = useState<'All' | 'Dine in' | 'Wait List' | 'Take Away' | 'Served'>('All');
  const [activeMenuCat, setActiveMenuCat] = useState<string>('special');
  const [orderCards, setOrderCards] = useState<OrderLineCard[]>(INITIAL_ORDER_CARDS);
  const [selectedOrder, setSelectedOrder] = useState<OrderLineCard | null>(null);
  const [activeOrderItems, setActiveOrderItems] = useState<{ [dishId: string]: number }>({
    'd-3': 2,
    'd-5': 2,
    'd-6': 1,
    'd-8': 1,
  });
  const [tableNumber, setTableNumber] = useState('04');
  const [orderNumber, setOrderNumber] = useState('#F0030');
  const [guestCount, setGuestCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Scan'>('Card');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── 2. State for MANAGE TABLE screen ─────────────────────────────────────
  const [tableResFilter, setTableResFilter] = useState<'All' | 'Reservation' | 'On Dine'>('All');
  const [tableZone, setTableZone] = useState<'Main Dining' | 'Terrace' | 'Outdoor'>('Main Dining');
  const [reservations, setReservations] = useState<TableReservation[]>(INITIAL_RESERVATIONS);
  const [floorTables, setFloorTables] = useState<FloorTable[]>(INITIAL_FLOOR_TABLES);
  const [customerSearch, setCustomerSearch] = useState('');

  // ─── 3. State for MANAGE DISHES screen ────────────────────────────────────
  const [dishesList, setDishesList] = useState<Dish[]>(INITIAL_DISHES);
  const [manageCat, setManageCat] = useState<string>('desserts');
  const [manageSearch, setManageSearch] = useState('');
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('desserts');
  const [newDishTag, setNewDishTag] = useState('Dessert');

  // ─── 4. State for SETTINGS & BRAND screen ──────────────────────────────────
  const [activeBrandSetting, setActiveBrandSetting] = useState<'batchoy-shop' | 'kyles-eatery' | 'auto'>('auto');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'settings') {
        setActiveNav('settings');
      }
      const saved = localStorage.getItem('kyles_active_brand');
      if (saved === 'batchoy-shop' || saved === 'kyles-eatery') {
        setActiveBrandSetting(saved);
      } else {
        setActiveBrandSetting('auto');
      }
    }
  }, []);

  const handleBrandSettingChange = (newSetting: 'batchoy-shop' | 'kyles-eatery' | 'auto') => {
    setActiveBrandSetting(newSetting);
    if (typeof window !== 'undefined') {
      if (newSetting === 'auto') {
        localStorage.removeItem('kyles_active_brand');
        document.cookie = 'kyles_active_brand=; Max-Age=0; path=/';
      } else {
        localStorage.setItem('kyles_active_brand', newSetting);
        document.cookie = `kyles_active_brand=${newSetting}; path=/; max-age=31536000`;
      }
      setToastMessage(
        `Active brand set to ${
          newSetting === 'auto'
            ? 'Automatic Schedule'
            : newSetting === 'batchoy-shop'
            ? 'Batchoy Shop (Red Theme)'
            : "Kyle's Eatery (Orange Theme)"
        }`
      );
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle Order Selection from Carousel
  const handleSelectOrderCard = (card: OrderLineCard) => {
    setSelectedOrder(card);
    setTableNumber(card.tableNumber.replace(/\D/g, '') || '01');
    setOrderNumber(card.orderNumber);
    setGuestCount(card.guestCount);

    const itemsMap: { [dishId: string]: number } = {};
    card.items.forEach((item) => {
      itemsMap[item.dishId] = item.quantity;
    });
    setActiveOrderItems(itemsMap);
  };

  // Stepper quantity update in Order Line
  const handleUpdateItemQty = (dish: Dish, delta: number) => {
    setActiveOrderItems((prev) => {
      const currentQty = prev[dish.id] || 0;
      const nextQty = Math.max(0, currentQty + delta);
      const updated = { ...prev };
      if (nextQty === 0) {
        delete updated[dish.id];
      } else {
        updated[dish.id] = nextQty;
      }
      return updated;
    });
  };

  // Place Order in Order Line
  const handlePlaceOrder = () => {
    const list = Object.entries(activeOrderItems);
    if (list.length === 0) {
      alert('Please add dishes to the order before placing.');
      return;
    }
    const newOrderNumber = `#F00${Math.floor(10 + Math.random() * 90)}`;
    const newCard: OrderLineCard = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      tableNumber: `Table ${tableNumber}`,
      itemCount: list.reduce((sum, [, q]) => sum + q, 0),
      timeAgo: 'Just Now',
      status: 'In Kitchen',
      colorTheme: 'mint',
      orderType: 'Dine in',
      guestCount,
      items: list.map(([id, q]) => {
        const dish = dishesList.find((d) => d.id === id);
        return {
          dishId: id,
          name: dish ? dish.name : 'Custom Dish',
          quantity: q,
          price: dish ? dish.price : 10.0,
        };
      }),
    };

    setOrderCards([newCard, ...orderCards]);
    setSelectedOrder(newCard);
    setOrderNumber(newOrderNumber);
    setToastMessage(`Order ${newOrderNumber} placed successfully for Table ${tableNumber}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Create new dish in Manage Dishes
  const handleCreateNewDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const newDish: Dish = {
      id: `d-${Date.now()}`,
      name: newDishName.trim(),
      category: newDishCategory,
      tag: newDishTag.trim() || 'Food',
      price: parseFloat(newDishPrice) || 12.0,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    };

    setDishesList([newDish, ...dishesList]);
    setShowAddDishModal(false);
    setNewDishName('');
    setNewDishPrice('');
    setToastMessage(`Dish "${newDish.name}" added to ${newDishCategory}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Computations for active order checkout
  const orderedList = Object.entries(activeOrderItems)
    .map(([dishId, quantity]) => {
      const dish = dishesList.find((d) => d.id === dishId);
      if (!dish || quantity <= 0) return null;
      return {
        dishId,
        dish,
        quantity,
        subtotal: dish.price * quantity,
      };
    })
    .filter(Boolean) as { dishId: string; dish: Dish; quantity: number; subtotal: number }[];

  const totalItemsCount = orderedList.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = orderedList.reduce((sum, i) => sum + i.subtotal, 0);
  const tax = subtotal > 0 ? 4.0 : 0.0;
  const donation = subtotal > 0 ? 1.0 : 0.0;
  const totalPayable = subtotal > 0 ? subtotal + tax + donation : 0.0;

  // Filtered dishes for Order Line
  const filteredOrderLineDishes = dishesList.filter((d) => {
    const matchCat =
      activeMenuCat === 'all' ||
      d.category === activeMenuCat ||
      (activeMenuCat === 'special' && d.isSpecial);
    const matchSearch =
      d.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      d.tag.toLowerCase().includes(globalSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered dishes for Manage Dishes screen
  const filteredManageDishes = dishesList.filter((d) => {
    const matchCat = manageCat === 'all' || d.category === manageCat;
    const matchSearch = d.name.toLowerCase().includes(manageSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered reservations for Manage Table screen
  const filteredReservations = reservations.filter((r) => {
    const matchType = tableResFilter === 'All' || r.type === tableResFilter;
    const matchSearch =
      r.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      r.table.toLowerCase().includes(customerSearch.toLowerCase());
    return matchType && matchSearch;
  });

  // Filtered floor plan tables by zone
  const filteredFloorTables = floorTables.filter((t) => t.zone === tableZone);

  return (
    <div className="tasty-admin-wrapper">
      {/* ──────────────────────────────────────────────────────────────────
          LEFT NAVIGATION SIDEBAR (Exact design with kyleseatery)
          ────────────────────────────────────────────────────────────────── */}
      <aside className="tasty-sidebar">
        {/* Brand Logo */}
        <div className="tasty-logo-container" onClick={() => router.push('/')}>
          <div className="tasty-logo-icon">
            <Flame size={20} />
          </div>
          <span className="tasty-logo-text">kyleseatery</span>
        </div>

        {/* Navigation Items */}
        <ul className="tasty-nav-menu">
          <li
            className={`tasty-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveNav('dashboard')}
          >
            <LayoutGrid size={18} />
            <span>Dashboard</span>
          </li>

          <li
            className={`tasty-nav-item ${activeNav === 'order-line' ? 'active' : ''}`}
            onClick={() => setActiveNav('order-line')}
          >
            <Receipt size={18} />
            <span>Order Line</span>
          </li>

          <li
            className={`tasty-nav-item ${activeNav === 'manage-table' ? 'active' : ''}`}
            onClick={() => setActiveNav('manage-table')}
          >
            <Rows3 size={18} />
            <span>Manage Table</span>
          </li>

          <li
            className={`tasty-nav-item ${activeNav === 'manage-dishes' ? 'active' : ''}`}
            onClick={() => setActiveNav('manage-dishes')}
          >
            <UtensilsCrossed size={18} />
            <span>Manage Dishes</span>
          </li>

          <li
            className={`tasty-nav-item ${activeNav === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveNav('customers')}
          >
            <Users size={18} />
            <span>Customers</span>
          </li>
        </ul>

        {/* Sidebar Bottom Nav */}
        <div className="tasty-sidebar-bottom">
          <div
            className={`tasty-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveNav('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </div>

          <div
            className="tasty-nav-item"
            onClick={() => alert('kyleseatery Help Center: All POS systems online and active.')}
          >
            <CircleHelp size={18} />
            <span>Help Center</span>
          </div>

          <div
            className="tasty-nav-item"
            onClick={() => {
              if (confirm('Log out from kyleseatery admin panel?')) {
                router.push('/');
              }
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────────
          CENTER / MAIN AREA
          ────────────────────────────────────────────────────────────────── */}
      <main className="tasty-main-area">
        {/* Sticky Topbar */}
        <header className="tasty-topbar">
          <div className="tasty-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search menu, orders and more"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="tasty-search-input"
            />
          </div>

          <div className="tasty-topbar-right">
            <button className="tasty-notif-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className="tasty-user-profile" onClick={() => setActiveNav('settings')}>
              <div className="tasty-user-avatar">IK</div>
              <div className="tasty-user-info">
                <span className="tasty-user-name">Ibrahim Kadri</span>
                <span className="tasty-user-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Toast Feedback */}
        {toastMessage && (
          <div
            style={{
              margin: '16px 28px 0',
              background: '#0d9488',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content View Switching */}
        <div className="tasty-body-row">
        <div className="tasty-content-body">
          {/* ================================================================
              SCREEN 1: ORDER LINE (FRONT SCREEN)
              ================================================================ */}
          {activeNav === 'order-line' && (
            <>
              {/* Order Line Header */}
              <section className="tasty-order-line-header">
                <h2 className="tasty-section-title">Order Line</h2>

                <div className="tasty-status-pills">
                  <button
                    className={`tasty-pill-btn ${activeStatusFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setActiveStatusFilter('All')}
                  >
                    <span>All</span>
                    <span className="tasty-pill-count count-all">74</span>
                  </button>

                  <button
                    className={`tasty-pill-btn ${activeStatusFilter === 'Dine in' ? 'active' : ''}`}
                    onClick={() => setActiveStatusFilter('Dine in')}
                  >
                    <span>Dine in</span>
                    <span className="tasty-pill-count count-dine">64</span>
                  </button>

                  <button
                    className={`tasty-pill-btn ${activeStatusFilter === 'Wait List' ? 'active' : ''}`}
                    onClick={() => setActiveStatusFilter('Wait List')}
                  >
                    <span>Wait List</span>
                    <span className="tasty-pill-count count-wait">05</span>
                  </button>

                  <button
                    className={`tasty-pill-btn ${activeStatusFilter === 'Take Away' ? 'active' : ''}`}
                    onClick={() => setActiveStatusFilter('Take Away')}
                  >
                    <span>Take Away</span>
                    <span className="tasty-pill-count count-take">12</span>
                  </button>

                  <button
                    className={`tasty-pill-btn ${activeStatusFilter === 'Served' ? 'active' : ''}`}
                    onClick={() => setActiveStatusFilter('Served')}
                  >
                    <span>Served</span>
                    <span className="tasty-pill-count count-served">99</span>
                  </button>
                </div>

                {/* Horizontal Order Cards */}
                <div className="tasty-order-cards-carousel">
                  <div className="tasty-order-cards-row">
                    {orderCards
                      .filter((c) => activeStatusFilter === 'All' || c.orderType === activeStatusFilter)
                      .slice(0, 3)
                      .map((card) => (
                        <div
                          key={card.id}
                          className={`tasty-order-card card-${card.colorTheme} ${
                            selectedOrder?.id === card.id ? 'selected' : ''
                          }`}
                          onClick={() => handleSelectOrderCard(card)}
                        >
                          <div className="tasty-order-card-header">
                            <span className="order-id-label">Order {card.orderNumber}</span>
                            <span className="table-tag-label">{card.tableNumber}</span>
                          </div>

                          <div className="tasty-order-card-body">Item: {card.itemCount}X</div>

                          <div className="tasty-order-card-footer">
                            <span className="order-time-text">{card.timeAgo}</span>
                            <span
                              className={`order-status-pill ${
                                card.status === 'In Kitchen'
                                  ? 'status-kitchen'
                                  : card.status === 'Wait List'
                                  ? 'status-wait'
                                  : card.status === 'Ready'
                                  ? 'status-ready'
                                  : 'status-served'
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <button
                    className="tasty-carousel-nav-btn"
                    title="Next Orders"
                    onClick={() => {
                      setOrderCards((prev) => [...prev.slice(1), prev[0]]);
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </section>

              {/* Foodies Menu Section */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="tasty-menu-header">
                  <h2 className="tasty-section-title">Foodies Menu</h2>
                  <div className="tasty-carousel-arrows">
                    <button
                      className="tasty-arrow-btn"
                      onClick={() => {
                        const cats = ['all', 'special', 'soups', 'desserts', 'chickens'];
                        const idx = cats.indexOf(activeMenuCat);
                        setActiveMenuCat(idx > 0 ? cats[idx - 1] : cats[cats.length - 1]);
                      }}
                      title="Previous Category"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="tasty-arrow-btn"
                      onClick={() => {
                        const cats = ['all', 'special', 'soups', 'desserts', 'chickens'];
                        const idx = cats.indexOf(activeMenuCat);
                        setActiveMenuCat(idx < cats.length - 1 ? cats[idx + 1] : cats[0]);
                      }}
                      title="Next Category"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="tasty-categories-row">
                  <div
                    className={`tasty-category-card ${activeMenuCat === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveMenuCat('all')}
                  >
                    <span className="tasty-category-icon">🍲</span>
                    <div className="tasty-category-info">
                      <span className="tasty-category-name">All Menu</span>
                      <span className="tasty-category-count">154 Items</span>
                    </div>
                  </div>

                  <div
                    className={`tasty-category-card ${activeMenuCat === 'special' ? 'active' : ''}`}
                    onClick={() => setActiveMenuCat('special')}
                  >
                    <span className="tasty-category-icon">🎂</span>
                    <div className="tasty-category-info">
                      <span className="tasty-category-name">Special</span>
                      <span className="tasty-category-count">19 Items</span>
                    </div>
                  </div>

                  <div
                    className={`tasty-category-card ${activeMenuCat === 'soups' ? 'active' : ''}`}
                    onClick={() => setActiveMenuCat('soups')}
                  >
                    <span className="tasty-category-icon">🥣</span>
                    <div className="tasty-category-info">
                      <span className="tasty-category-name">Soups</span>
                      <span className="tasty-category-count">3 Items</span>
                    </div>
                  </div>

                  <div
                    className={`tasty-category-card ${activeMenuCat === 'desserts' ? 'active' : ''}`}
                    onClick={() => setActiveMenuCat('desserts')}
                  >
                    <span className="tasty-category-icon">🍰</span>
                    <div className="tasty-category-info">
                      <span className="tasty-category-name">Desserts</span>
                      <span className="tasty-category-count">19 Items</span>
                    </div>
                  </div>

                  <div
                    className={`tasty-category-card ${activeMenuCat === 'chickens' ? 'active' : ''}`}
                    onClick={() => setActiveMenuCat('chickens')}
                  >
                    <span className="tasty-category-icon">🍗</span>
                    <div className="tasty-category-info">
                      <span className="tasty-category-name">Chickens</span>
                      <span className="tasty-category-count">10 Items</span>
                    </div>
                  </div>
                </div>

                {/* Dish Cards Grid */}
                <div className="tasty-dishes-grid">
                  {filteredOrderLineDishes.slice(0, 8).map((dish) => {
                    const qty = activeOrderItems[dish.id] || 0;
                    return (
                      <div
                        key={dish.id}
                        className={`tasty-dish-card ${qty > 0 ? 'active-order' : ''}`}
                      >
                        <div className="tasty-dish-img-center">
                          <img src={dish.imageUrl} alt={dish.name} className="tasty-dish-img" />
                        </div>

                        <div>
                          <span className="tasty-dish-category">{dish.tag}</span>
                          <h4 className="tasty-dish-name" title={dish.name}>{dish.name}</h4>
                        </div>

                        <div className="tasty-dish-bottom">
                          <span className="tasty-dish-price">${dish.price.toFixed(2)}</span>

                          <div className="tasty-stepper">
                            <button
                              className="tasty-step-btn"
                              onClick={() => handleUpdateItemQty(dish, -1)}
                              disabled={qty === 0}
                              style={{ opacity: qty === 0 ? 0.4 : 1 }}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="tasty-step-qty">{qty}</span>
                            <button
                              className="tasty-step-btn plus-btn"
                              onClick={() => handleUpdateItemQty(dish, 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* ================================================================
              SCREEN 2: MANAGE TABLE (TOP-LEFT SCREEN)
              ================================================================ */}
          {activeNav === 'manage-table' && (
            <div className="tasty-tables-layout">
              {/* Left Reservations / Queue Sub-panel */}
              <div className="tasty-reservations-col">
                <div className="tasty-res-filter-row">
                  <button
                    className={`tasty-res-filter-btn ${tableResFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setTableResFilter('All')}
                  >
                    <span>All</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>12</span>
                  </button>
                  <button
                    className={`tasty-res-filter-btn ${tableResFilter === 'Reservation' ? 'active' : ''}`}
                    onClick={() => setTableResFilter('Reservation')}
                  >
                    <span>Reservation</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>07</span>
                  </button>
                  <button
                    className={`tasty-res-filter-btn ${tableResFilter === 'On Dine' ? 'active' : ''}`}
                    onClick={() => setTableResFilter('On Dine')}
                  >
                    <span>On Dine</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>05</span>
                  </button>
                </div>

                {/* Date Picker */}
                <div className="tasty-date-picker-row">
                  <ChevronLeft size={16} style={{ cursor: 'pointer', color: '#64748b' }} />
                  <span>Thu, 11 January 2024</span>
                  <ChevronRight size={16} style={{ cursor: 'pointer', color: '#64748b' }} />
                </div>

                {/* Search Customers */}
                <div className="tasty-search-box" style={{ width: '100%', padding: '6px 14px' }}>
                  <Search size={14} style={{ color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search customers"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="tasty-search-input"
                  />
                </div>

                {/* Reservations List */}
                <div className="tasty-res-list">
                  {filteredReservations.map((res) => (
                    <div key={res.id} className="tasty-res-card">
                      <div className="tasty-res-top">
                        <span
                          className={`tasty-time-pill ${
                            res.status === 'On Dine'
                              ? 'time-orange'
                              : res.status === 'Free'
                              ? 'time-blue'
                              : 'time-teal'
                          }`}
                        >
                          {res.time}
                        </span>
                        <span
                          className={`tasty-res-tag ${
                            res.status === 'Payment' || res.status === 'Paid'
                              ? 'tag-payment'
                              : res.status === 'On Dine' || res.status === 'Unpaid'
                              ? 'tag-ondine'
                              : 'tag-free'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="tasty-res-name">{res.name}</div>

                      <div className="tasty-res-meta">
                        <span>{res.table}</span>
                        <span>•</span>
                        <span>{res.guests} Guests</span>
                        {res.phone && (
                          <>
                            <span>•</span>
                            <span style={{ fontSize: '11px' }}>{res.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Reservation Button */}
                <button
                  className="tasty-add-res-btn"
                  onClick={() => {
                    const name = prompt('Guest Name:');
                    if (name) {
                      const newRes: TableReservation = {
                        id: `res-${Date.now()}`,
                        time: '8:45 PM',
                        name,
                        table: 'Table 7',
                        guests: 4,
                        phone: '+84 900 123 456',
                        tag: 'Dinner',
                        status: 'Payment',
                        type: 'Reservation',
                      };
                      setReservations([newRes, ...reservations]);
                    }
                  }}
                >
                  <Plus size={16} />
                  <span>Add New Reservation</span>
                </button>
              </div>

              {/* Right Table Map (Floor Plan) */}
              <div className="tasty-floorplan-col">
                <div className="tasty-floorplan-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                      Manage Tables
                    </h3>
                    <div className="tasty-floor-legends" style={{ marginTop: '8px' }}>
                      <span>
                        <span className="legend-dot legend-available"></span>Available
                      </span>
                      <span>
                        <span className="legend-dot legend-reserved"></span>Reserved
                      </span>
                      <span>
                        <span className="legend-dot legend-ondine"></span>On Dine
                      </span>
                    </div>
                  </div>

                  {/* Zone Tabs */}
                  <div className="tasty-zones-toggle">
                    {(['Main Dining', 'Terrace', 'Outdoor'] as const).map((z) => (
                      <button
                        key={z}
                        className={`zone-pill-btn ${tableZone === z ? 'active' : ''}`}
                        onClick={() => setTableZone(z)}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2D Table Floor Plan Grid */}
                <div className="tasty-floorplan-grid">
                  {filteredFloorTables.map((tbl) => (
                    <div
                      key={tbl.id}
                      className="tasty-table-seat-container"
                      onClick={() => {
                        const nextStatus =
                          tbl.status === 'available'
                            ? 'ondine'
                            : tbl.status === 'ondine'
                            ? 'reserved'
                            : 'available';
                        setFloorTables((prev) =>
                          prev.map((t) => (t.id === tbl.id ? { ...t, status: nextStatus } : t))
                        );
                      }}
                      title="Click to toggle status"
                    >
                      {/* Top Chairs */}
                      <div className="tasty-chairs-row">
                        {Array.from({ length: Math.ceil(tbl.capacity / 2) }).map((_, i) => (
                          <div key={i} className="tasty-chair-icon"></div>
                        ))}
                      </div>

                      {/* Table Surface */}
                      <div
                        className={`tasty-table-surface ${
                          tbl.status === 'available'
                            ? 'table-surface-mint'
                            : tbl.status === 'ondine'
                            ? 'table-surface-peach'
                            : 'table-surface-blue'
                        }`}
                      >
                        <span className="tasty-table-name">{tbl.name}</span>
                        <span className="tasty-table-capacity">
                          <User size={12} />
                          {tbl.capacity} Seats
                        </span>
                      </div>

                      {/* Bottom Chairs */}
                      <div className="tasty-chairs-row">
                        {Array.from({ length: Math.floor(tbl.capacity / 2) }).map((_, i) => (
                          <div key={i} className="tasty-chair-icon"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SCREEN 3: MANAGE DISHES (TOP-RIGHT SCREEN)
              ================================================================ */}
          {activeNav === 'manage-dishes' && (
            <div className="tasty-dishes-management-layout">
              {/* Left Categories Sub-panel */}
              <div className="tasty-categories-col">
                <span className="tasty-categories-col-title">Dishes Category</span>

                <div className="tasty-cat-nav-list">
                  {[
                    { key: 'all', icon: '🍲', name: 'All Dishes', count: 154 },
                    { key: 'breakfast', icon: '🍳', name: 'Breakfast', count: 12 },
                    { key: 'beef', icon: '🥩', name: 'Beef Dishes', count: 6 },
                    { key: 'biryani', icon: '🍚', name: 'Biryani', count: 5 },
                    { key: 'chickens', icon: '🍗', name: 'Chicken Dishes', count: 10 },
                    { key: 'desserts', icon: '🍰', name: 'Desserts', count: 19 },
                    { key: 'dinner', icon: '🥘', name: 'Dinner', count: 8 },
                  ].map((cat) => (
                    <div
                      key={cat.key}
                      className={`tasty-cat-nav-item ${manageCat === cat.key ? 'active' : ''}`}
                      onClick={() => setManageCat(cat.key)}
                    >
                      <div className="tasty-cat-left">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                      <span className="tasty-cat-badge">{cat.count}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="tasty-add-cat-btn"
                  onClick={() => {
                    const c = prompt('Enter new category name:');
                    if (c) alert(`Category "${c}" created successfully.`);
                  }}
                >
                  <Plus size={16} />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Right Dishes Grid */}
              <div className="tasty-dishes-main-col">
                <div className="tasty-dishes-toolbar">
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    {manageCat.charAt(0).toUpperCase() + manageCat.slice(1)} (19)
                  </h3>

                  <div className="tasty-dishes-toolbar-right">
                    <div className="tasty-tool-search">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Search dishes"
                        value={manageSearch}
                        onChange={(e) => setManageSearch(e.target.value)}
                      />
                    </div>

                    <button className="tasty-tool-btn">
                      <SlidersHorizontal size={14} />
                      <span>Filter</span>
                    </button>

                    <button
                      className="tasty-add-dish-btn"
                      onClick={() => setShowAddDishModal(true)}
                    >
                      <Plus size={15} />
                      <span>Add New Dishes</span>
                    </button>
                  </div>
                </div>

                {/* Manage Dishes Grid with Dashed Add Card */}
                <div className="tasty-manage-grid">
                  {/* Dashed Add Card matching image */}
                  <div
                    className="tasty-dish-add-card"
                    onClick={() => setShowAddDishModal(true)}
                  >
                    <div className="tasty-add-circle">
                      <Plus size={20} />
                    </div>
                    <span className="tasty-add-card-label">
                      Add New Dish to {manageCat.charAt(0).toUpperCase() + manageCat.slice(1)}
                    </span>
                  </div>

                  {/* Dish Cards */}
                  {filteredManageDishes.map((dish) => (
                    <div key={dish.id} className="tasty-manage-dish-card">
                      <div className="tasty-manage-card-top">
                        <input type="checkbox" className="tasty-checkbox" />
                        <div
                          className="tasty-manage-dots"
                          onClick={() => {
                            if (confirm(`Delete ${dish.name}?`)) {
                              setDishesList(dishesList.filter((d) => d.id !== dish.id));
                            }
                          }}
                        >
                          <MoreVertical size={16} />
                        </div>
                      </div>

                      <div className="tasty-dish-img-center">
                        <img src={dish.imageUrl} alt={dish.name} className="tasty-dish-img" />
                      </div>

                      <div>
                        <span className="tasty-dish-category">{dish.tag}</span>
                        <h4 className="tasty-dish-name" title={dish.name}>{dish.name}</h4>
                      </div>

                      <span className="tasty-dish-price" style={{ marginTop: 'auto' }}>
                        ${dish.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SCREEN 4: DASHBOARD / OVERVIEW
              ================================================================ */}
          {activeNav === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 className="tasty-section-title">Dashboard Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Today&apos;s Revenue</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0d9488', marginTop: '6px' }}>$1,248.50</div>
                </div>
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Active Orders</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{orderCards.length}</div>
                </div>
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Tables Occupied</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>6 / 12</div>
                </div>
                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Customers Served</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>84</div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SCREEN 5: SETTINGS & SYSTEM
              ================================================================ */}
          {activeNav === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Brand Switcher Settings Card */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h2 className="tasty-section-title" style={{ margin: 0 }}>Brand & Ordering Theme Mode</h2>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Switch the active customer ordering brand, menu items, and Japanese visual theme.
                      </p>
                    </div>
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        border: '1px solid #e2e8f0',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    >
                      <span>Preview Customer Menu</span>
                      <span style={{ fontSize: '14px' }}>↗</span>
                    </a>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {/* Option 1: Batchoy Shop */}
                  <div
                    onClick={() => handleBrandSettingChange('batchoy-shop')}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      borderRadius: '14px',
                      border: activeBrandSetting === 'batchoy-shop' ? '2px solid #8d2d2b' : '1px solid #e2e8f0',
                      background: activeBrandSetting === 'batchoy-shop' ? '#fdf2f2' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: activeBrandSetting === 'batchoy-shop' ? '0 4px 12px rgba(141, 45, 43, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#8d2d2b', display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#8d2d2b' }}>Batchoy Shop</span>
                      </div>
                      {activeBrandSetting === 'batchoy-shop' && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#8d2d2b', color: '#ffffff', padding: '2px 8px', borderRadius: '999px' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Crimson red pattern theme with authentic Iloilo Batchoy menu items (₱45–₱199).
                    </p>
                  </div>

                  {/* Option 2: Kyle's Eatery */}
                  <div
                    onClick={() => handleBrandSettingChange('kyles-eatery')}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      borderRadius: '14px',
                      border: activeBrandSetting === 'kyles-eatery' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                      background: activeBrandSetting === 'kyles-eatery' ? '#fff7ed' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: activeBrandSetting === 'kyles-eatery' ? '0 4px 12px rgba(234, 88, 12, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#ea580c' }}>Kyle&apos;s Eatery</span>
                      </div>
                      {activeBrandSetting === 'kyles-eatery' && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#ea580c', color: '#ffffff', padding: '2px 8px', borderRadius: '999px' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Warm orange & soft white pattern theme with signature comfort food menu.
                    </p>
                  </div>

                  {/* Option 3: Auto Schedule */}
                  <div
                    onClick={() => handleBrandSettingChange('auto')}
                    style={{
                      cursor: 'pointer',
                      padding: '16px',
                      borderRadius: '14px',
                      border: activeBrandSetting === 'auto' ? '2px solid #0d9488' : '1px solid #e2e8f0',
                      background: activeBrandSetting === 'auto' ? '#f0fdfa' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: activeBrandSetting === 'auto' ? '0 4px 12px rgba(13, 148, 136, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f766e' }}>Auto (Weekly Schedule)</span>
                      </div>
                      {activeBrandSetting === 'auto' && (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#0d9488', color: '#ffffff', padding: '2px 8px', borderRadius: '999px' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Mon–Sat: Kyle&apos;s Eatery | Sunday: Batchoy Shop (Automatic calendar switch).
                    </p>
                  </div>
                </div>
              </div>

              {/* General System Information Card */}
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>General System Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
                  <p style={{ margin: 0 }}><strong>Restaurant Account:</strong> kyleseatery</p>
                  <p style={{ margin: 0 }}><strong>Weekly Schedule:</strong> Mon–Sat Kyle&apos;s Eatery | Sun Batchoy Shop</p>
                  <p style={{ margin: 0 }}><strong>Currency:</strong> PHP (₱) / USD ($)</p>
                  <p style={{ margin: 0 }}><strong>Administrator:</strong> Ibrahim Kadri (Admin)</p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              SCREEN 6: CUSTOMERS
              ================================================================ */}
          {activeNav === 'customers' && (
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 className="tasty-section-title">Customer Directory</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reservations.map((res) => (
                  <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600 }}>{res.name}</span>
                    <span style={{ color: '#64748b' }}>{res.phone || 'Walk-in'}</span>
                    <span style={{ color: '#0d9488', fontWeight: 600 }}>{res.table}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>{/* end tasty-content-body */}

          {/* ──────────────────────────────────────────────────────────────────
              RIGHT SIDEBAR (Active Order Checkout matching image)
              Visible during Order Line
              ────────────────────────────────────────────────────────────────── */}
          {activeNav === 'order-line' && (
            <div className="tasty-order-col">

              {/* ── CARD 1: Order Details ── */}
              <div className="tasty-order-card-panel">
                {/* Table No Header */}
                <div className="tasty-receipt-header">
                  <div>
                    <h3 className="table-title">Table No #{tableNumber}</h3>
                    <span className="order-code-sub">Order {orderNumber}</span>
                  </div>
                  <div className="table-header-right">
                    <div className="table-actions">
                      <button
                        className="receipt-icon-btn"
                        title="Edit Table"
                        onClick={() => {
                          const t = prompt('Enter Table Number:', tableNumber);
                          if (t) setTableNumber(t.padStart(2, '0'));
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="receipt-icon-btn trash"
                        title="Clear Order"
                        onClick={() => setActiveOrderItems({})}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <span className="table-people-tag">{guestCount} People</span>
                  </div>
                </div>

                {/* Ordered Items Header */}
                <div className="ordered-items-header">
                  <span className="ordered-items-title">Ordered Items</span>
                  <span className="ordered-count-tag">{totalItemsCount.toString().padStart(2, '0')}</span>
                </div>

                {/* Scrollable Items */}
                <div className="ordered-items-scroll">
                  {orderedList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: '#94a3b8', fontSize: '13px' }}>
                      No dishes added yet. Click &ldquo;+&rdquo; on any dish to build order.
                    </div>
                  ) : (
                    orderedList.map((item) => (
                      <div key={item.dishId} className="ordered-item-row">
                        <span className="ordered-item-name">
                          <span className="ordered-item-qty">{item.quantity}x</span> {item.dish.name}
                        </span>
                        <span className="ordered-item-subtotal">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Payment Summary */}
                <div className="payment-summary-block">
                  <h4 className="payment-summary-title">Payment Summery</h4>
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Donation for Palestine</span>
                    <span>${donation.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>Total Payable</span>
                    <span className="total-amount-display">${totalPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: Payment Method ── */}
              <div className="tasty-payment-method-card">
                <h4 className="payment-method-title">Payment Method</h4>
                <div className="payment-methods-grid">
                  <button
                    className={`payment-btn ${paymentMethod === 'Cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('Cash')}
                  >
                    <Banknote size={15} />
                    <span>Cash</span>
                  </button>
                  <button
                    className={`payment-btn ${paymentMethod === 'Card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('Card')}
                  >
                    <CreditCard size={15} />
                    <span>Card</span>
                  </button>
                  <button
                    className={`payment-btn ${paymentMethod === 'Scan' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('Scan')}
                  >
                    <QrCode size={15} />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              {/* ── Bottom Actions ── */}
              <div className="order-sidebar-actions">
                <button className="print-btn" onClick={() => window.print()} title="Print Order Receipt">
                  <Printer size={16} />
                  <span>Print</span>
                </button>
                <button className="place-order-btn" onClick={handlePlaceOrder}>
                  <Timer size={16} />
                  <span>Place Order</span>
                </button>
              </div>

            </div>
          )}
        </div>{/* end tasty-body-row */}
      </main>


      {/* ── Add Dish Modal ── */}
      {showAddDishModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowAddDishModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '28px',
              borderRadius: '20px',
              width: '440px',
              maxWidth: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Add New Dish to {manageCat.charAt(0).toUpperCase() + manageCat.slice(1)}
            </h3>

            <form onSubmit={handleCreateNewDish} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Dish Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pistachio Syrniki"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={newDishPrice}
                  onChange={(e) => setNewDishPrice(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dessert, Breakfast, Pasta"
                  value={newDishTag}
                  onChange={(e) => setNewDishTag(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save Dish
                </button>
              </div>
            </form>
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
            background: '#f8fafc',
            color: '#0d9488',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#0d9488',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>
      }
    >
      <AdminPortalApp />
    </Suspense>
  );
}
