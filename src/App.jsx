import { useState, useEffect, useRef } from 'react';
import { Calculator, ShoppingBag, RefreshCw, PlusCircle, Trash2, Home, Image as ImageIcon, Upload, Edit3, Check, X, Eye, AlertTriangle, Plus, Search, Truck, Moon, Sun, TrendingUp, TrendingDown, Wallet, User, Phone, Send as TelegramIcon, Key, MapPin, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

// --- КОНФИГУРАЦИЯ БОТА И СЕРВЕРА ---
const BACKEND_URL = "https://mekhaserver-production.up.railway.app"; // Ваша ссылка с Render

// --- Компонент загрузки фото ---
const ImageUploader = ({ onImageUpload, currentPreview, isDarkMode }) => {
  const [previewUrl, setPreviewUrl] = useState(currentPreview || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreviewUrl(currentPreview || null);
  }, [currentPreview]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageUpload(file); 
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all ${
          isDarkMode 
            ? 'bg-[#2A2A2A] border-gray-700 text-rose-300 hover:border-rose-400' 
            : 'bg-white border-rose-200 text-[#58111A] hover:border-[#58111A]'
        }`}
      >
        <Upload size={14} />
        Выбрать из галереи
      </button>

      <div className={`w-11 h-11 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner ${
        isDarkMode ? 'border-gray-700 bg-[#252525]' : 'border-rose-100 bg-white'
      }`}>
        {previewUrl ? (
          <img src={previewUrl} alt="Превью" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={16} className={isDarkMode ? 'text-gray-500' : 'text-rose-200'} />
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
  const savedTab = localStorage.getItem('mekha_active_tab');

  const allowedTabs = ['home', 'products', 'calc', 'courier'];

  return allowedTabs.includes(savedTab) ? savedTab : 'home';
});

const [swipeDirection, setSwipeDirection] = useState('next');

// Свайп между разделами
const swipeStart = useRef(null);
const [swipeOffset, setSwipeOffset] = useState(0);
const [isDragging, setIsDragging] = useState(false);
const [pullDistance, setPullDistance] = useState(0);
const [isRefreshing, setIsRefreshing] = useState(false);
const tabOrder = ['home', 'products', 'calc', 'courier'];

const handleTouchStart = (e) => {
  const touch = e.touches[0];

  swipeStart.current = {
    x: touch.clientX,
    y: touch.clientY,
    section: e.target.closest('section')
  };

  setSwipeOffset(0);
  setPullDistance(0);
  setIsDragging(false);
};

const handleTouchMove = (e) => {
  if (!swipeStart.current || isRefreshing) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - swipeStart.current.x;
  const deltaY = touch.clientY - swipeStart.current.y;

  // Обновление при движении вниз с самого верха
  if (
    deltaY > 0 &&
    Math.abs(deltaY) > Math.abs(deltaX) * 1.2 &&
    swipeStart.current.section?.scrollTop <= 0
  ) {
    setPullDistance(Math.min(deltaY * 0.55, 90));
    return;
  }

  // Вертикальную прокрутку не перехватываем
  if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) return;

  const currentIndex = tabOrder.indexOf(activeTab);

  if (
    (currentIndex === 0 && deltaX > 0) ||
    (currentIndex === tabOrder.length - 1 && deltaX < 0)
  ) {
    setSwipeOffset(deltaX * 0.25);
  } else {
    setSwipeOffset(deltaX);
  }

  setIsDragging(true);
};

const handleTouchEnd = (e) => {
  if (!swipeStart.current) return;

  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - swipeStart.current.x;
  const deltaY = touch.clientY - swipeStart.current.y;

  swipeStart.current = null;

  if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
    if (pullDistance >= 55 && !isRefreshing) {
      refreshAppData();
    } else {
      setPullDistance(0);
    }

    setSwipeOffset(0);
    setIsDragging(false);
    return;
  }

  const currentIndex = tabOrder.indexOf(activeTab);

  if (Math.abs(deltaX) >= 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
    if (deltaX < 0 && currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  }

  setSwipeOffset(0);
  setPullDistance(0);
  setIsDragging(false);
};

const handleTouchCancel = () => {
  swipeStart.current = null;
  setSwipeOffset(0);
  setPullDistance(0);
  setIsDragging(false);
};

  
  useEffect(() => {
  localStorage.setItem('mekha_active_tab', activeTab);
}, [activeTab]);
  
  const [rates, setRates] = useState({ 
    CNY_USD: 0.14, 
    USD_TJS: 10.9, 
    USD_change: +0.45, 
    CNY_change: -0.12  
  });
  const [loading, setLoading] = useState(false);

  // Тема
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Поиск товаров
  const [searchQuery, setSearchQuery] = useState('');

  // Модальные окна
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [evaporatingProductId, setEvaporatingProductId] = useState(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState(1);
  
  // Кастомное уведомление
  const [modalAlert, setModalAlert] = useState(null);

  // Чат службы поддержки
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportHistory, setSupportHistory] = useState([]);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [supportClientId] = useState(() => {
    const key = 'mekha_support_client_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  });

  // Синхронизация истории поддержки и счётчика непрочитанных ответов
  useEffect(() => {
    let active = true;
    const loadSupportMessages = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/support-messages?clientId=${encodeURIComponent(supportClientId)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        const messages = Array.isArray(data.messages) ? data.messages : [];
        setSupportHistory(messages.map(item => ({
          id: item.id,
          sender: item.sender,
          text: item.message,
          isRead: item.is_read
        })));
        const unread = messages.filter(item => item.sender === 'support' && !item.is_read).length;
        setSupportUnreadCount(unread);
        if (isSupportOpen && unread > 0) {
          await fetch(`${BACKEND_URL}/api/support-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: supportClientId })
          });
          if (active) setSupportUnreadCount(0);
        }
      } catch (error) {
        console.error('Support sync failed:', error);
      }
    };
    loadSupportMessages();
    const timer = setInterval(loadSupportMessages, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [supportClientId, isSupportOpen]);

  // СПИСОК КУРЬЕРОВ
  const [couriers, setCouriers] = useState(() => {
    const saved = localStorage.getItem('mekha_couriers');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Нодир', chatId: '907176273' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mekha_couriers', JSON.stringify(couriers));
  }, [couriers]);

  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierChatId, setNewCourierChatId] = useState('');

  // КАЛЬКУЛЯТОР
  const [calcUnitPriceCNY, setCalcUnitPriceCNY] = useState('45');
  const [calcQuantity, setCalcQuantity] = useState('10');
  const [calcCargoCost, setCalcCargoCost] = useState('15');
  const [calcCargoCurrency, setCalcCargoCurrency] = useState('USD');

    // КАТАЛОГ ТОВАРОВ — ИСТОЧНИК ДАННЫХ: POSTGRESQL
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки каталога: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.products)) {
        throw new Error('Сервер вернул некорректный каталог');
      }

      const serverProducts = data.products.map(product => ({
        id: product.id,
        legacyId: product.legacyId,
        title: product.title,
        photo: product.photo || '',
        quantity: Number(product.quantity || 0),

        totalWholesale: Number(product.totalWholesaleTjs || 0),
        wholesaleCurrency: 'TJS',

        cargoCost: Number(product.cargoCostTjs || 0),
        cargoCurrency: 'TJS',

        unitCostTjs: Number(product.unitCostTjs || 0),
        salePriceTjs: Number(product.salePriceTjs || 0)
      }));

      setProducts(serverProducts);
      return true;

    } catch (error) {
      console.error('Ошибка загрузки каталога:', error);
      return false;

    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
  loadProducts();

  const intervalId = setInterval(() => {
    loadProducts();
  }, 5000);

  return () => clearInterval(intervalId);
}, []);


  // ИСТОРИЯ ОТПРАВОК
  const [deliveries, setDeliveries] = useState(() => {
    const saved = localStorage.getItem('mekha_deliveries');
    return saved ? JSON.parse(saved) : [];
  });

  const deliveriesRef = useRef(deliveries);
deliveriesRef.current = deliveries;

const syncInProgressRef = useRef(false);

  
// СИНХРОНИЗАЦИЯ СТАТУСОВ ПО UUID ЗАКАЗА
useEffect(() => {
  const syncUpdates = async () => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;

    try {
      const response = await fetch(`${BACKEND_URL}/api/updates`);

      if (!response.ok) {
        throw new Error(`Updates API: ${response.status}`);
      }

      const updates = await response.json();

      if (!Array.isArray(updates) || updates.length === 0) return;

      const eventIdsToAck = [];

      for (const event of updates) {
        const eventId = Number(event.id);
        const orderId = String(event.orderId || '');

        if (!Number.isInteger(eventId) || eventId <= 0 || !orderId) {
          continue;
        }

        const current = deliveriesRef.current;

        const index = current.findIndex(
          delivery => String(delivery.orderId || delivery.id) === orderId
        );

        // Не найден соответствующий заказ — не подтверждаем событие.
        if (index === -1) continue;

        const order = current[index];

        // Уже обработано: повторно склад не списываем.
        if (order.isProcessed) {
          eventIdsToAck.push(eventId);
          continue;
        }

        if (!['DELIVERED', 'RETURN'].includes(event.type)) continue;

        const updatedOrder = {
          ...order,
          status: event.type === 'DELIVERED'
            ? 'Доставлено ✅'
            : 'Возврат ⚠️',
          updatedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isProcessed: true,
          returnReason: event.reason || ''
        };

        const nextDeliveries = [...current];
        nextDeliveries[index] = updatedOrder;

        deliveriesRef.current = nextDeliveries;
        setDeliveries(nextDeliveries);

        setModalAlert(
          event.type === 'DELIVERED'
            ? {
                title: 'Заказ доставлен! 🎉',
                message: `Курьер подтвердил доставку заказа №${order.publicNumber || '—'}.`,
                type: 'success'
              }
            : {
                title: 'Внимание: возврат ⚠️',
                message: `Курьер отметил возврат заказа №${order.publicNumber || '—'}. ${
                  event.reason || ''
                }`,
                type: 'error'
              }
        );

        eventIdsToAck.push(eventId);
      }

      // Подтверждаем серверу только обработанные события.
      if (eventIdsToAck.length > 0) {
        const ackResponse = await fetch(
          `${BACKEND_URL}/api/updates/ack`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              eventIds: [...new Set(eventIdsToAck)]
            })
          }
        );

        if (!ackResponse.ok) {
          throw new Error(`Updates ACK: ${ackResponse.status}`);
        }
      }

    } catch (error) {
      console.error('Order synchronization error:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  };

  syncUpdates();

  const interval = setInterval(syncUpdates, 3000);

  return () => clearInterval(interval);
}, []);


  // Функция подписки на пуш-уведомления (на правильном месте внутри App)
  const subscribeUserToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Ваш браузер не поддерживает пуш-уведомления');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        const publicVapidKey = 'ВАШ_PUBLIC_VAPID_КЛЮЧ'; 
        const convertedKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        await fetch(`${BACKEND_URL}/api/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });

        setModalAlert({
          title: "Успешно! 🎉",
          message: "Пуш-уведомления на телефон успешно активированы.",
          type: "success"
        });
      } else {
        alert('Вы заблокировали показ уведомлений в браузере.');
      }
    } catch (err) {
      console.error('Ошибка подписки:', err);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Форма отправки курьеру
  const [deliveryItems, setDeliveryItems] = useState([]); 
  const [currentSelectedProduct, setCurrentSelectedProduct] = useState(null);
  const [currentQty, setCurrentQty] = useState('1');
  const [selectedCourierId, setSelectedCourierId] = useState(couriers[0]?.id || '');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [deliveryComment, setDeliveryComment] = useState('');
  const [sendingStatus, setSendingStatus] = useState(false);

  // Форма товара
  const [editingId, setEditingId] = useState(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodQty, setProdQty] = useState('6');
  const [prodWholesale, setProdWholesale] = useState('');
  const [prodWholesaleCurrency, setProdWholesaleCurrency] = useState('CNY');
  const [prodCargoCost, setProdCargoCost] = useState('');
  const [prodCargoCurrency, setProdCargoCurrency] = useState('USD');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [currentPhotoPreview, setCurrentPhotoPreview] = useState(null);
  const [isQuickAddMenuOpen, setIsQuickAddMenuOpen] = useState(false);

  
  // ФОРМА НОВОЙ ЗАКУПОЧНОЙ ПАРТИИ
  const BATCH_DRAFT_KEY = 'mekha_purchase_batch_draft_v1';
  const readBatchDraft = () => {
    try {
      const raw = localStorage.getItem(BATCH_DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (!draft || !Array.isArray(draft.batchItems)) return null;

      // Удаляем пустые позиции, оставшиеся от старой версии формы,
      // и не восстанавливаем одну модель дважды.
      const seenProductIds = new Set();
      const cleanItems = draft.batchItems.filter(item => {
        const productId = String(item?.productId || '').trim();
        if (!productId || seenProductIds.has(productId)) return false;
        seenProductIds.add(productId);
        return true;
      });

      return cleanItems.length
        ? { ...draft, batchItems: cleanItems }
        : null;
    } catch {
      return null;
    }
  };
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showBatchDraftChoice, setShowBatchDraftChoice] = useState(false);
  const [batchNotes, setBatchNotes] = useState(() => readBatchDraft()?.batchNotes || '');
  const [batchItems, setBatchItems] = useState(() => readBatchDraft()?.batchItems || []);
  const [batchSaving, setBatchSaving] = useState(false);

  // ПОШАГОВОЕ ОФОРМЛЕНИЕ ПОСТАВКИ
  const [batchStep, setBatchStep] = useState(() => readBatchDraft()?.batchStep || 1);
  const [batchName, setBatchName] = useState(() => readBatchDraft()?.batchName || '');
  const [showBatchVariants, setShowBatchVariants] = useState(false);
  const [batchNewProductTitle, setBatchNewProductTitle] = useState('');
  const [batchNewProductPhoto, setBatchNewProductPhoto] = useState('');
  const [showBatchProductCreation, setShowBatchProductCreation] = useState(false);

  // Автоматически сохраняем незавершённую поставку в браузере.
  useEffect(() => {
    if (batchItems.length === 0 || !batchName) return;
    try {
      localStorage.setItem(BATCH_DRAFT_KEY, JSON.stringify({
        batchItems,
        batchNotes,
        batchName,
        batchStep,
        batchNewProductTitle,
        batchNewProductPhoto,
        showBatchProductCreation
      }));
    } catch (error) {
      console.error('Не удалось сохранить черновик поставки:', error);
      setModalAlert({
        title: 'Не удалось сохранить черновик',
        message: 'В браузере недостаточно места. Уменьшите размер фотографии товара и повторите попытку.',
        type: 'error'
      });
    }
  }, [batchItems, batchNotes, batchName, batchStep, batchNewProductTitle, batchNewProductPhoto, showBatchProductCreation]);

  const createEmptyBatchItem = () => ({
    productId: '',
    productTitle: '',
    productPhoto: '',
    quantity: '1',
    wholesaleAmount: '',
    wholesaleCurrency: 'CNY',
    cargoAmount: '',
    cargoCurrency: 'USD',
    salePriceTjs: '',
    variants: [
      { color: 'Без цвета', size: 'Без размера', quantity: '1' }
    ]
  });

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates) {
        setRates({
          CNY_USD: 1 / (data.rates.CNY || 7.2),
          USD_TJS: data.rates.TJS || 10.9,
          USD_change: +0.25,
          CNY_change: -0.15,
        });
      }
    } catch (err) {
      console.error('Ошибка курса:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAppData = async () => {
  if (isRefreshing) return;

  setIsRefreshing(true);

  try {
    const results = await Promise.all([
      loadProducts(),
      fetchRates()
    ]);

    const productsUpdated = results[0];

    if (!productsUpdated) {
      console.error('Не удалось обновить каталог товаров');
    }
  } catch (error) {
    console.error('Ошибка обновления данных:', error);
  } finally {
    setIsRefreshing(false);
    setPullDistance(0);
  }
};

  useEffect(() => {
    fetchRates();
  }, []);

  const handleNumericInput = (setter) => (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setter(val);
  };

  const unitCNY = parseFloat(calcUnitPriceCNY) || 0;
  const qty = parseInt(calcQuantity) || 1;
  const cargoVal = parseFloat(calcCargoCost) || 0;

  const totalWholesaleCNY = unitCNY * qty;
  const totalWholesaleUSD = totalWholesaleCNY * rates.CNY_USD;

  let cargoUSD = cargoVal;
  if (calcCargoCurrency === 'CNY') cargoUSD = cargoVal * rates.CNY_USD;
  if (calcCargoCurrency === 'TJS') cargoUSD = cargoVal / rates.USD_TJS;

  const totalCostUSD = totalWholesaleUSD + cargoUSD;
  const totalCostTJS = totalCostUSD * rates.USD_TJS;

  const singleCostUSD = totalCostUSD / qty;
  const singleCostTJS = totalCostTJS / qty;

  const handleAddCourier = (e) => {
    e.preventDefault();
    if (!newCourierName || !newCourierChatId) return;
    const newC = {
      id: Date.now(),
      name: newCourierName,
      chatId: newCourierChatId.trim()
    };
    setCouriers([...couriers, newC]);
    setNewCourierName('');
    setNewCourierChatId('');
    if (!selectedCourierId) setSelectedCourierId(newC.id);
  };


const handleSendOrder = async (e) => {
  e.preventDefault();

  const courierObj = couriers.find(
    c => c.id === selectedCourierId
  );

  if (!courierObj || !courierObj.chatId) {
    setModalAlert({
      title: "Ошибка",
      message: "Не выбран курьер или у него не указан Chat ID.",
      type: "error"
    });
    return;
  }

  if (deliveryItems.length === 0) {
    setModalAlert({
      title: "Ошибка",
      message: "Добавьте хотя бы один товар в заказ.",
      type: "error"
    });
    return;
  }

  setSendingStatus(true);

  try {
    const response = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courierName: courierObj.name,
        courierChatId: courierObj.chatId,
        clientPhone,
        clientAddress,
        comment: deliveryComment,
        items: deliveryItems.map(item => ({
         productId: item.productId || null,
         title: item.title,
         qty: Number(item.qty)
    }))
      })
    });

    const data = await response.json();

    if (response.status === 201 && data.success) {
      const newDelivery = {
        id: data.orderId,
        orderId: data.orderId,
        items: deliveryItems,
        courierName: courierObj.name,
        clientPhone,
        address: clientAddress,
        comment: deliveryComment,
        status: 'Ожидает ответа курьера ⏳',
        sentAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isProcessed: false
      };

      setDeliveries(prev => [newDelivery, ...prev]);
      setDeliveryItems([]);
      setClientPhone('');
      setClientAddress('');
      setDeliveryComment('');

      setModalAlert({
        title: "Успешно отправлено!",
        message: `Заказ отправлен курьеру ${courierObj.name}.`,
        type: "success"
      });

    } else {
      setModalAlert({
        title: data.saved
          ? "Заказ сохранён, но не отправлен"
          : "Ошибка отправки",
        message: data.error || "Не удалось отправить заказ.",
        type: "error"
      });
    }

  } catch (err) {
    console.error("Order request error:", err);

    setModalAlert({
      title: "Ошибка сети",
      message: "Не удалось связаться с сервером.",
      type: "error"
    });

  } finally {
    setSendingStatus(false);
  }
};

  const updateBatchItem = (itemIndex, field, value) => {
  setBatchItems(prev =>
    prev.map((item, index) => {
      if (index !== itemIndex) return item;

      const updated = { ...item, [field]: value };

      // Если вариант только один и он стандартный,
      // синхронизируем его количество с количеством модели.
      if (
        field === 'quantity' &&
        item.variants.length === 1 &&
        item.variants[0].color === 'Без цвета' &&
        item.variants[0].size === 'Без размера'
      ) {
        updated.variants = [{
          ...item.variants[0],
          quantity: value
        }];
      }

      return updated;
    })
  );
};

const updateBatchVariant = (itemIndex, variantIndex, field, value) => {
  setBatchItems(prev =>
    prev.map((item, index) => {
      if (index !== itemIndex) return item;

      return {
        ...item,
        variants: item.variants.map((variant, vIndex) =>
          vIndex === variantIndex
            ? { ...variant, [field]: value }
            : variant
        )
      };
    })
  );
};

const addBatchVariant = (itemIndex) => {
  setBatchItems(prev =>
    prev.map((item, index) =>
      index === itemIndex
        ? {
            ...item,
            variants: [
              ...item.variants,
              { color: '', size: 'Без размера', quantity: '0' }
            ]
          }
        : item
    )
  );
};

const removeBatchVariant = (itemIndex, variantIndex) => {
  setBatchItems(prev =>
    prev.map((item, index) =>
      index === itemIndex
        ? {
            ...item,
            variants: item.variants.filter(
              (_, vIndex) => vIndex !== variantIndex
            )
          }
        : item
    )
  );
};

const addBatchModel = () => {
  setBatchItems(prev => [...prev, createEmptyBatchItem()]);
};

const removeBatchModel = (itemIndex) => {
  setBatchItems(prev =>
    prev.filter((_, index) => index !== itemIndex)
  );
};

  
const handleSavePurchaseBatch = async (e) => {
  e?.preventDefault?.();

  if (batchSaving) return;

  if (batchItems.length === 0) {
    setModalAlert({
      title: 'Ошибка',
      message: 'Добавьте хотя бы одну модель.',
      type: 'error'
    });
    return;
  }

  const payloadItems = [];

  for (const item of batchItems) {
    const catalogProduct = products.find(
      p => String(p.id) === String(item.productId) || String(p.legacyId || '') === String(item.productId)
    );
    const product = catalogProduct || (
      item.productTitle
        ? { title: item.productTitle, photo: item.productPhoto || '' }
        : null
    );

    if (!product) {
      setModalAlert({
        title: 'Ошибка',
        message: 'Выберите модель из каталога.',
        type: 'error'
      });
      return;
    }

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setModalAlert({
        title: 'Проверьте количество',
        message: 'Количество товара должно быть целым числом больше нуля.',
        type: 'error'
      });
      return;
    }

    // Если варианты не заполнены, создаём стандартный вариант.
    const variants = item.variants?.length
      ? item.variants
      : [{
          color: 'Без цвета',
          size: 'Без размера',
          quantity: String(quantity)
        }];

    const variantsTotal = variants.reduce(
      (sum, variant) => sum + Number(variant.quantity || 0),
      0
    );

    if (variantsTotal !== quantity) {
      setModalAlert({
        title: 'Проверьте варианты',
        message: `Количество вариантов модели «${product.title}» должно совпадать с общим количеством.`,
        type: 'error'
      });
      return;
    }

    const wholesaleAmount = Number(item.wholesaleAmount);
    const cargoAmount = Number(item.cargoAmount);

    // Цена продажи необязательна.
    const salePrice = item.salePriceTjs === ''
      ? 0
      : Number(item.salePriceTjs);

    const wholesaleRate = getCurrencyRateToTJS(
      item.wholesaleCurrency
    );

    const cargoRate = getCurrencyRateToTJS(
      item.cargoCurrency
    );

    if (
      item.wholesaleAmount === '' ||
      item.cargoAmount === '' ||
      !Number.isFinite(wholesaleAmount) ||
      !Number.isFinite(cargoAmount) ||
      !Number.isFinite(salePrice) ||
      wholesaleAmount < 0 ||
      cargoAmount < 0 ||
      salePrice < 0 ||
      !Number.isFinite(wholesaleRate) ||
      !Number.isFinite(cargoRate) ||
      wholesaleRate <= 0 ||
      cargoRate <= 0
    ) {
      setModalAlert({
        title: 'Проверьте стоимость',
        message: `Проверьте суммы, валюты и курсы для модели «${product.title}».`,
        type: 'error'
      });
      return;
    }

    payloadItems.push({
      legacyId: String(item.productId),
      title: product.title,
      photo: product.photo,
      quantity,

      wholesaleAmount,
      wholesaleCurrency: item.wholesaleCurrency,
      wholesaleRateToTjs: wholesaleRate,

      cargoAmount,
      cargoCurrency: item.cargoCurrency,
      cargoRateToTjs: cargoRate,

      salePriceTjs: salePrice,

      variants: variants.map(variant => ({
        color: variant.color?.trim() || 'Без цвета',
        size: variant.size?.trim() || 'Без размера',
        quantity: Number(variant.quantity)
      }))
    });
  }

  setBatchSaving(true);

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/purchase-batches`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: batchName
            ? `${batchName}${batchNotes ? `\n${batchNotes}` : ''}`
            : batchNotes,
          items: payloadItems
        })
      }
    );

    const responseText = await response.text();
    let data = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `Сервер вернул некорректный ответ (HTTP ${response.status}). Проверьте размер фотографии и повторите попытку.`
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || `Не удалось сохранить партию (HTTP ${response.status})`
      );
    }
    await loadProducts();
    localStorage.removeItem(BATCH_DRAFT_KEY);
    setBatchItems([]);
    setBatchNotes('');
    setBatchName('');
    setBatchStep(1);
    setShowBatchVariants(false);
    setIsBatchModalOpen(false);

    setModalAlert({
      title: 'Партия сохранена',
      message: `Закупочная партия №${data.batchNumber} успешно зарегистрирована.`,
      type: 'success'
    });

  } catch (error) {
    console.error('Purchase batch save failed:', error);
    setModalAlert({
      title: 'Поставка не сохранена',
      message: error.message || 'Не удалось связаться с сервером. Черновик сохранён — можно повторить попытку.',
      type: 'error'
    });
  } finally {
    setBatchSaving(false);
  }
};

  const handleCreateBatchProduct = () => {
  const cleanTitle = batchNewProductTitle.trim();

  if (!cleanTitle) {
    setModalAlert({
      title: 'Укажите название',
      message: 'Введите название новой модели товара.',
      type: 'error'
    });
    return;
  }

  const newProduct = {
    id: Date.now(),
    title: cleanTitle,
    photo: batchNewProductPhoto ||
      'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400',
    quantity: 0,
    totalWholesale: 0,
    wholesaleCurrency: 'CNY',
    cargoCost: 0,
    cargoCurrency: 'USD'
  };

  // Создаём товар и сразу добавляем его в текущую поставку.
  // Не требуем повторного нажатия в каталоге: это предотвращает
  // случайное снятие только что выбранной модели.
  setProducts(prev => [newProduct, ...prev]);
  setBatchItems(prev => [
    ...prev.filter(item => item.productId),
    {
      ...createEmptyBatchItem(),
      productId: String(newProduct.id),
      productTitle: newProduct.title,
      productPhoto: newProduct.photo
    }
  ]);

  setBatchNewProductTitle('');
  setBatchNewProductPhoto('');
  setShowBatchProductCreation(false);
};  

  const handleSubmitProduct = async (e) => {
  e.preventDefault();

  const cleanTitle = prodTitle.trim();

  if (!cleanTitle) {
    setModalAlert({
      title: 'Укажите название',
      message: 'Введите название модели товара.',
      type: 'error'
    });
    return;
  }

  const currentEditingId = editingId;

  try {
    if (currentEditingId) {
      // Обновляем существующий товар в PostgreSQL.
      const response = await fetch(
        `${BACKEND_URL}/api/products/${encodeURIComponent(currentEditingId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: cleanTitle,
            photo: currentPhotoPreview || ''
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Не удалось сохранить изменения');
      }

      // Получаем обновлённый каталог с сервера.
      await loadProducts();

    } else {
      // Новую модель пока создаём локально.
      const newProduct = {
        id: Date.now(),
        title: cleanTitle,
        photo: currentPhotoPreview ||
          'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400',
        quantity: 0,
        totalWholesale: 0,
        wholesaleCurrency: 'CNY',
        cargoCost: 0,
        cargoCurrency: 'USD'
      };

      setProducts(prev => [newProduct, ...prev]);
    }

    setEditingId(null);
    setProdTitle('');
    setProdQty('');
    setProdWholesale('');
    setProdCargoCost('');
    setSelectedImageFile(null);
    setCurrentPhotoPreview(null);
    setIsAddModalOpen(false);

    setModalAlert({
      title: currentEditingId
        ? 'Изменения сохранены'
        : 'Модель добавлена',
      message: currentEditingId
        ? 'Название и фотография товара обновлены на сервере.'
        : 'Модель добавлена. Для появления остатка оформите поставку.',
      type: 'success'
    });

  } catch (error) {
    console.error('Ошибка сохранения товара:', error);

    setModalAlert({
      title: 'Ошибка сохранения',
      message: error.message || 'Не удалось связаться с сервером.',
      type: 'error'
    });
  }
};

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setProdTitle(p.title);
    setProdQty(p.quantity.toString());
    setProdWholesale(p.totalWholesale.toString());
    setProdWholesaleCurrency(p.wholesaleCurrency);
    setProdCargoCost(p.cargoCost.toString());
    setProdCargoCurrency(p.cargoCurrency);
    setCurrentPhotoPreview(p.photo);
    setIsAddModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setProdTitle('');
    setProdQty('6');
    setProdWholesale('');
    setProdCargoCost('');
    setSelectedImageFile(null);
    setCurrentPhotoPreview(null);
    setIsAddModalOpen(false);
  };

  const confirmDeleteProduct = async () => {
  if (!productToDelete) return;

  const productId = productToDelete.id;

  try {
    // Close the confirmation overlay first so the product card animation is visible.
    setProductToDelete(null);
    setDeleteConfirmationStep(1);
    setEvaporatingProductId(productId);

    // Allow React to render the smoke animation before calling the API.
    await new Promise(resolve => setTimeout(resolve, 950));

    const response = await fetch(
      `${BACKEND_URL}/api/products/${encodeURIComponent(productId)}`,
      {
        method: 'DELETE'
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Не удалось удалить товар');
    }

    await loadProducts();

    if (editingId === productId) {
      handleCancelEdit();
    }

    setProductToDelete(null);
    setDeleteConfirmationStep(1);
    setEvaporatingProductId(null);

    setModalAlert({
      title: 'Товар удалён',
      message: 'Модель удалена из каталога.',
      type: 'success'
    });

  } catch (error) {
    console.error('Ошибка удаления товара:', error);

    setProductToDelete(null);
    setEvaporatingProductId(null);

    setModalAlert({
      title: 'Ошибка удаления',
      message: error.message || 'Не удалось связаться с сервером.',
      type: 'error'
    });
  }
};

  const formatCurrencyValue = (val, curr) => {
    if (curr === 'TJS') return `${val} TJS`;
    const sym = curr === 'CNY' ? '¥' : '$';
    return `${sym}${val}`;
  };

    const calcSingleItemTJS = (p) => {
    let wholesaleUSD = p.totalWholesale;

    if (p.wholesaleCurrency === 'CNY') {
      wholesaleUSD = p.totalWholesale * rates.CNY_USD;
    }

    if (p.wholesaleCurrency === 'TJS') {
      wholesaleUSD = p.totalWholesale / rates.USD_TJS;
    }

    let cargoUSD = p.cargoCost;

    if (p.cargoCurrency === 'CNY') {
      cargoUSD = p.cargoCost * rates.CNY_USD;
    }

    if (p.cargoCurrency === 'TJS') {
      cargoUSD = p.cargoCost / rates.USD_TJS;
    }

    const totalUSD = wholesaleUSD + cargoUSD;

    return ((totalUSD / (p.quantity || 1)) * rates.USD_TJS).toFixed(0);
  };

  const getCurrencyRateToTJS = (currency) => {
    if (currency === 'TJS') return 1;
    if (currency === 'USD') return Number(rates.USD_TJS);

    if (currency === 'CNY') {
      return Number(rates.CNY_USD) * Number(rates.USD_TJS);
    }

    return 0;
  };

  const calculateBatchItemCost = (item) => {
    const wholesale = Number(item.wholesaleAmount) || 0;
    const cargo = Number(item.cargoAmount) || 0;
    const quantity = Number(item.quantity) || 0;

    if (quantity <= 0) return 0;

    const wholesaleTJS =
      wholesale * getCurrencyRateToTJS(item.wholesaleCurrency);

    const cargoTJS =
      cargo * getCurrencyRateToTJS(item.cargoCurrency);

    return (wholesaleTJS + cargoTJS) / quantity;
  };

    const batchInputClass = `w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8B2635] ${
    isDarkMode
      ? 'bg-[#2A2A2A] border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-900'
  }`;
  
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto shadow-2xl font-sans select-none relative transition-colors duration-200 ${
      isDarkMode ? 'bg-[#121212] text-gray-100' : 'bg-[#FAF8F5] text-gray-900'
    }`}>
      
      <style>{`
  html, body, #root {
    min-height: 100%;
    background-color: ${isDarkMode ? '#121212' : '#FAF8F5'};
  }

  html, body {
    margin: 0;
    overscroll-behavior-y: none;
  }

  @keyframes product-evaporate {
    0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    35% { opacity: .8; transform: translateY(-8px) scale(.98); filter: blur(1px); }
    100% { opacity: 0; transform: translateY(-34px) scale(.88); filter: blur(9px); }
  }

  @keyframes product-smoke {
    0% { opacity: 0; transform: translateY(12px) scale(.55); }
    25% { opacity: .55; }
    100% { opacity: 0; transform: translateY(-65px) scale(1.65); }
  }

  .product-evaporating {
    position: relative;
    animation: product-evaporate 900ms ease-in forwards;
    pointer-events: none;
  }

  .product-smoke-cloud {
    position: absolute;
    z-index: 5;
    left: 18%;
    bottom: 4px;
    width: 64%;
    height: 72px;
    pointer-events: none;
    border-radius: 50%;
    background:
      radial-gradient(ellipse at 30% 65%, rgba(180,180,180,.42) 0 16%, transparent 42%),
      radial-gradient(ellipse at 55% 45%, rgba(210,210,210,.48) 0 20%, transparent 48%),
      radial-gradient(ellipse at 72% 68%, rgba(155,155,155,.35) 0 15%, transparent 43%);
    filter: blur(8px);
    animation: product-smoke 900ms ease-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .product-evaporating, .product-smoke-cloud { animation-duration: 1ms; }
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type=number] {
    -moz-appearance: textfield;
  }
`}</style>

      {/* Шапка */}
      <header className="bg-[#58111A] text-white p-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-9 h-9 rounded-full bg-rose-900 border-2 border-rose-300/60 flex items-center justify-center font-bold text-xs text-rose-100 shadow-md active:scale-95 transition-transform relative group"
            title="Профиль и настройка ботов"
          >
            M
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#58111A] rounded-full"></span>
          </button>
          <div>
            <h1 className="font-bold text-sm tracking-wide">Mekha Shop</h1>
            <p className="text-[10px] text-rose-200">Панель управления</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSupportOpen(true)}
            className="bg-black/30 p-2 rounded-xl text-rose-100 active:scale-95 transition-transform relative"
            title="Служба поддержки"
            aria-label="Открыть службу поддержки"
          >
            <MessageSquare size={17} />
            {supportUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse ring-2 ring-[#58111A]">
                {supportUnreadCount > 9 ? '9+' : supportUnreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="bg-black/30 p-2 rounded-xl text-rose-100 active:scale-95 transition-transform"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Основной контент */}
        <main
        className="relative flex-1 min-h-0 overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
        
        <div
            className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none"
            style={{
              transform: `translateY(${Math.max(pullDistance, isRefreshing ? 55 : 0) - 45}px)`,
              opacity: pullDistance > 5 || isRefreshing ? 1 : 0,
              transition: isRefreshing ? 'transform 200ms ease' : 'none'
            }}
          >
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg border border-rose-100 text-[#58111A] text-xs font-semibold">
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              {isRefreshing ? 'Обновляем данные...' : pullDistance >= 55 ? 'Отпусти для обновления' : 'Потяни вниз для обновления'}             </div>
          </div>

        <div
          className="flex h-full w-[400%] will-change-transform"
          style={{
            transform: `translate3d(calc(-${tabOrder.indexOf(activeTab) * 25}% + ${swipeOffset}px), 0, 0)`,
            transition: isDragging
              ? 'none'
              : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >

        {/* ЭКРАН 1 — ГЛАВНАЯ */}
        <section className="w-1/4 h-full flex-none overflow-y-auto p-3 pb-24">

          <div className="space-y-4">
            
            <div className="bg-gradient-to-br from-[#58111A] to-[#3d0b12] text-white p-5 rounded-3xl shadow-md space-y-3 relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-20px] opacity-10 text-8xl font-bold">M</div>
              <span className="text-[10px] bg-white/20 text-rose-100 px-2.5 py-1 rounded-full font-semibold">
                Бизнес-Монитор
              </span>
              <div>
                <h2 className="text-base font-bold">Главная панель Mekha Shop ✨</h2>
                <p className="text-xs text-rose-200 mt-0.5">Оперативные новости валютного рынка и аналитика.</p>
              </div>
            </div>

            {/* НОВОСТИ ВАЛЮТ */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#58111A] uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw size={14} /> Мониторинг курсов валют
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3.5 rounded-2xl border shadow-sm space-y-1.5 ${
                  isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400">USD / TJS</span>
                    <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-green-700">
                      <TrendingUp size={12} className="mr-0.5" /> +{rates.USD_change}%
                    </span>
                  </div>
                  <div className="font-extrabold text-base">
                    {rates.USD_TJS.toFixed(2)} <span className="text-xs font-medium text-gray-400">сом</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border shadow-sm space-y-1.5 ${
                  isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400">CNY / USD</span>
                    <span className="flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                      <TrendingDown size={12} className="mr-0.5" /> {rates.CNY_change}%
                    </span>
                  </div>
                  <div className="font-extrabold text-base">
                    ${rates.CNY_USD.toFixed(3)} <span className="text-xs font-medium text-gray-400">¥</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2.5 ${
                isDarkMode ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-rose-50/70 border-rose-200 text-[#58111A]'
              }`}>
                <Wallet size={18} className="flex-shrink-0" />
                <p className="text-[11px] leading-snug">
                  <b>Совет по закупке:</b> Юань опустился на {Math.abs(rates.CNY_change)}% — выгодное время для оплаты товаров на 1688!
                </p>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  setEditingId(null);
                  setProdTitle('');
                  setProdQty('6');
                  setProdWholesale('');
                  setProdCargoCost('');
                  setSelectedImageFile(null);
                  setCurrentPhotoPreview(null);
                  setIsAddModalOpen(true);
                }}
                className={`p-3.5 rounded-2xl border shadow-sm text-left space-y-1.5 active:scale-95 transition-transform ${
                  isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#58111A] flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs">Добавить товар</h3>
                  <p className="text-[10px] text-gray-400">Внести модель в базу</p>
                </div>
              </button>

              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className={`p-3.5 rounded-2xl border shadow-sm text-left space-y-1.5 active:scale-95 transition-transform ${
                  isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#58111A] flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs">Настройка бота</h3>
                  <p className="text-[10px] text-gray-400">Chat ID курьеров</p>
                </div>
              </button>
            </div>

          </div>
        </section>

        {/* ТОВАРЫ */}
        <section className="w-1/4 h-full flex-none overflow-y-auto p-3 pb-24">
          <div className="space-y-3.5">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-[#58111A] uppercase tracking-wider">
                  Каталог моделей
                </h2>
                <span className="text-[10px] bg-rose-100 text-[#58111A] px-2 py-0.5 rounded-full font-medium">
                  Всего: {filteredProducts.length} моделей
                </span>
              </div>
            
            </div>

            <div className="relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию товара..."
                className={`w-full pl-9 pr-4 py-2.5 border rounded-2xl text-xs outline-none focus:border-[#58111A] shadow-sm ${
                  isDarkMode ? 'bg-[#1E1E1E] border-gray-800 text-white' : 'bg-white border-rose-100 text-gray-900'
                }`}
              />
              <Search size={15} className="absolute left-3 top-3 text-gray-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border p-6 text-center text-sm text-gray-400">
                  Товары не найдены
                </div>
              ) : (
                filteredProducts.map(p => {
                  const costPerItemTJS = calcSingleItemTJS(p);
            
                  return (
                    <article
                      key={p.id}
                      className={`flex h-[104px] overflow-hidden rounded-2xl border shadow-sm ${evaporatingProductId === p.id ? 'product-evaporating' : ''} ${
                        isDarkMode
                          ? 'bg-[#1E1E1E] border-gray-800'
                          : 'bg-white border-rose-100'
                      } ${
                        editingId === p.id ? 'ring-1 ring-rose-400' : ''
                      }`}
                    >
                      {evaporatingProductId === p.id && (
                        <span className="product-smoke-cloud" aria-hidden="true" />
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedProductDetails(p)}
                        className="w-[28%] max-w-[100px] min-w-[76px] h-full shrink-0 overflow-hidden rounded-l-2xl bg-gray-100"
                      >
                        <img
                          src={p.photo}
                          alt={p.title}
                          className="w-full h-full object-contain p-1"
                        />
                      </button>
            
                      <div className="min-w-0 flex-1 px-3 py-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProductDetails(p)}
                            className={`min-w-0 truncate text-left text-[13px] font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {p.title}
                          </button>
            
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(p)}
                              aria-label="Редактировать"
                              className="p-1 text-gray-400"
                            >
                              <Edit3 size={16} />
                            </button>
            
                            <button
                              onClick={() => {
                                setProductToDelete(p);
                                setDeleteConfirmationStep(1);
                              }}
                              aria-label="Удалить"
                              className="p-1 text-gray-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
            
                        <div className="grid grid-cols-2 gap-2">
                          <div className="min-w-0">
                            <span className="block text-[10px] text-gray-400">
                              Оптовая цена
                            </span>
                            <span className="block truncate text-[11px] font-semibold">
                              {formatCurrencyValue(p.totalWholesale, p.wholesaleCurrency)}
                            </span>
                          </div>
            
                          <div className="min-w-0">
                            <span className="block text-[10px] text-gray-400">
                              Карго
                            </span>
                            <span className="block truncate text-[11px] font-semibold">
                              {formatCurrencyValue(p.cargoCost, p.cargoCurrency)}
                            </span>
                          </div>
                        </div>
            
                        <div className="flex items-end justify-between gap-1">
                          <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                            isDarkMode
                              ? 'bg-[#303030] text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            Остаток: {p.quantity} шт
                          </span>
            
                          <div className="min-w-0 text-right leading-tight">
                            <span className="block text-[9px] text-gray-400">
                              Себестоимость / шт.
                            </span>
                            <span className="block text-[13px] font-extrabold text-rose-500">
                              {costPerItemTJS} TJS
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

          </div>
        </section>

        {/* КАЛЬКУЛЯТОР */}
        <section className="w-1/4 h-full flex-none overflow-y-auto p-3 pb-24">
          <div className="space-y-4">
            
            <div className={`p-3.5 rounded-2xl border shadow-sm flex justify-around text-center ${
              isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
            }`}>
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">1 Юань (¥)</span>
                <span className="font-bold text-xs text-rose-400">${rates.CNY_USD.toFixed(3)}</span>
              </div>
              <div className={`border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}></div>
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">1 Доллар ($)</span>
                <span className="font-bold text-xs text-rose-400">{rates.USD_TJS.toFixed(2)} TJS</span>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border shadow-sm space-y-3.5 ${
              isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
            }`}>
              <h2 className="text-xs font-bold text-[#58111A] uppercase tracking-wider flex items-center gap-1.5">
                <Calculator size={15} /> Расчет планируемой закупки
              </h2>

              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-gray-400 font-medium">Цена за 1 шт (¥ Юань)</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={calcUnitPriceCNY}
                    onChange={handleNumericInput(setCalcUnitPriceCNY)}
                    placeholder="45"
                    className={`w-full p-2.5 border rounded-xl text-sm font-semibold outline-none focus:border-[#58111A] ${
                      isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-[10px] text-gray-400 font-medium">Количество (шт)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={calcQuantity}
                    onChange={handleNumericInput(setCalcQuantity)}
                    placeholder="10"
                    className={`w-full p-2.5 border rounded-xl text-sm font-bold text-center outline-none focus:border-[#58111A] ${
                      isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-medium">Стоимость доставки Карго</label>
                <div className={`flex border rounded-xl overflow-hidden focus-within:border-[#58111A] p-1 gap-1 ${
                  isDarkMode ? 'bg-[#2A2A2A] border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={calcCargoCost}
                    onChange={handleNumericInput(setCalcCargoCost)}
                    placeholder="Карго за всё" 
                    className="w-full px-2.5 py-1.5 bg-transparent text-sm outline-none font-medium"
                  />
                  <div className={`flex p-0.5 rounded-lg text-[10px] font-bold ${isDarkMode ? 'bg-black/30' : 'bg-gray-200/60'}`}>
                    {['CNY', 'USD', 'TJS'].map((curr) => (
                      <button
                        type="button"
                        key={curr}
                        onClick={() => setCalcCargoCurrency(curr)}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          calcCargoCurrency === curr 
                            ? 'bg-[#58111A] text-white shadow-sm' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {curr === 'CNY' ? '¥' : curr === 'USD' ? '$' : 'TJS'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
              isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
            }`}>
              <h3 className="text-xs font-bold text-[#58111A] uppercase tracking-wider">Мгновенный итог расчетов</h3>

              <div className={`space-y-2 text-xs divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-100'}`}>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400">Закуп товара оптом:</span>
                  <span className="font-bold">¥{totalWholesaleCNY.toFixed(0)} (${totalWholesaleUSD.toFixed(1)})</span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-400">Доставка Карго:</span>
                  <span className="font-bold">{formatCurrencyValue(cargoVal, calcCargoCurrency)}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 font-bold">
                  <span className="text-gray-400">Всего расходы ($):</span>
                  <span>${totalCostUSD.toFixed(1)}</span>
                </div>

                <div className={`flex justify-between items-center py-2 text-sm p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-rose-950/30 border-rose-900/40' : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <span className="font-bold text-rose-400">Всего в Сомони (TJS):</span>
                  <span className="font-extrabold text-red-500 text-base">{totalCostTJS.toFixed(0)} TJS</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#58111A] to-[#3d0b12] text-white p-3.5 rounded-2xl flex justify-between items-center shadow-md mt-2">
                <div>
                  <span className="text-[10px] text-rose-200 block font-medium">Себестоимость 1 штуки:</span>
                  <span className="text-xs text-rose-100 font-semibold">${singleCostUSD.toFixed(2)} / шт</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-white block">{singleCostTJS.toFixed(0)} TJS</span>
                  <span className="text-[9px] text-rose-300 font-medium">с учетом карго</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* РАЗДЕЛ КУРЬЕР / ОТПРАВКИ */}
        <section className="w-1/4 h-full flex-none overflow-y-auto p-3 pb-24">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-[#58111A] uppercase tracking-wider">Отправка заказов в Telegram</h2>
              <span className="text-[10px] bg-rose-100 text-[#58111A] px-2 py-0.5 rounded-full font-medium">Всего: {deliveries.length}</span>
            </div>

            {/* Форма отправки */}
            <form onSubmit={handleSendOrder} className={`p-4 rounded-3xl border shadow-sm space-y-3.5 ${
              isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
            }`}>
              <h3 className="text-xs font-semibold flex items-center gap-1.5">
                <Truck size={14} className="text-[#58111A]" /> Оформить доставку курьеру
              </h3>

              {/* ДОБАВЛЕНИЕ ТОВАРОВ В ЗАКАЗ */}
              <div className={`space-y-2 p-3 rounded-2xl border ${
                isDarkMode ? 'bg-[#2A2A2A] border-gray-700' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Состав заказа (товары):</label>
                
                {deliveryItems && deliveryItems.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {deliveryItems.map((prodItem, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-2 rounded-xl border text-xs ${
                        isDarkMode ? 'bg-[#1E1E1E] border-gray-700 text-white' : 'bg-white border-rose-100 text-gray-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          {prodItem.photo && <img src={prodItem.photo} alt="" className="w-7 h-7 object-cover rounded-md border" />}
                          <span className="font-bold">{prodItem.title}</span>
                          <span className="text-rose-500 font-semibold">({prodItem.qty} шт.)</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setDeliveryItems(deliveryItems.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-center relative">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Выберите товар из базы..."
                      className={`w-full pl-8 pr-3 py-2.5 rounded-xl text-xs outline-none border ${
                        isDarkMode 
                          ? 'bg-[#1E1E1E] border-gray-600 text-white focus:border-rose-400' 
                          : 'bg-white border-rose-200 text-gray-900 focus:border-[#58111A]'
                      }`}
                      style={{ outline: 'none', boxShadow: 'none' }}
                    />
                    <Search size={14} className="absolute left-2.5 top-3.5 text-gray-400" />

                    {searchQuery.trim() !== '' && (
                      <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-xl z-30 max-h-40 overflow-y-auto ${
                        isDarkMode ? 'bg-[#1E1E1E] border-gray-700 text-white' : 'bg-white border-rose-200 text-gray-900'
                      }`}>
                        {products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setCurrentSelectedProduct(p);
                              setSearchQuery(p.title);
                            }}
                            className={`flex items-center gap-2 p-2.5 cursor-pointer border-b last:border-none ${
                              isDarkMode ? 'hover:bg-[#333] border-gray-800' : 'hover:bg-rose-50 border-gray-100'
                            }`}
                          >
                            <img src={p.photo} alt="" className="w-7 h-7 object-cover rounded-md border" />
                            <div className="text-xs">
                              <span className="font-bold">{p.title}</span>
                              <span className="text-[10px] text-gray-400 ml-1">({p.quantity} шт)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <input 
                    type="text"
                    inputMode="numeric"
                    value={currentQty}
                    onChange={handleNumericInput(setCurrentQty)}
                    placeholder="Кол"
                    className={`w-16 py-2.5 px-2 rounded-xl text-xs font-bold text-center outline-none border ${
                      isDarkMode 
                        ? 'bg-[#1E1E1E] border-gray-600 text-white focus:border-rose-400' 
                        : 'bg-white border-rose-200 text-gray-900 focus:border-[#58111A]'
                    }`}
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentSelectedProduct) {
                        if (searchQuery.trim()) {
                          setDeliveryItems([...deliveryItems, { title: searchQuery, qty: parseInt(currentQty) || 1, photo: '' }]);
                          setSearchQuery('');
                          setCurrentQty('1');
                        }
                        return;
                      }
                      setDeliveryItems([...deliveryItems, { 
                        productId: currentSelectedProduct.id,
                        title: currentSelectedProduct.title, 
                        photo: currentSelectedProduct.photo, 
                        qty: parseInt(currentQty) || 1 
                      }]);
                      setCurrentSelectedProduct(null);
                      setSearchQuery('');
                      setCurrentQty('1');
                    }}
                    className="bg-[#58111A] hover:bg-[#430d14] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
                  >
                    <Plus size={14} /> Добавить
                  </button>
                </div>
              </div>

              <div className="relative">
                <input 
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Адрес получателя (например, пр. Рудаки 120)"
                  className={`w-full pl-9 pr-4 p-3 border rounded-xl text-xs outline-none focus:border-[#58111A] ${
                    isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <MapPin size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>

              <div className="relative">
                <input 
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Телефон (+992...)"
                  className={`w-full pl-9 pr-4 p-3 border rounded-xl text-xs outline-none focus:border-[#58111A] ${
                    isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <Phone size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>

              <div className="relative">
                <input 
                  type="text"
                  value={deliveryComment}
                  onChange={(e) => setDeliveryComment(e.target.value)}
                  placeholder="Комментарий для курьера (опционально)"
                  className={`w-full pl-9 pr-4 p-3 border rounded-xl text-xs outline-none focus:border-[#58111A] ${
                    isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <MessageSquare size={15} className="absolute left-3 top-3.5 text-gray-400" />
              </div>

              {/* Выбор курьера карточками */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] text-gray-400 font-medium">Выберите курьера:</label>
                {couriers.length === 0 ? (
                  <p className="text-xs text-rose-500 font-medium">Сначала добавьте курьера в профиле</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {couriers.map(c => {
                      const isSelected = selectedCourierId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCourierId(c.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isSelected 
                              ? 'bg-[#58111A] border-[#58111A] text-white shadow-md' 
                              : (isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800')
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs">{c.name}</div>
                            <div className={`text-[9px] ${isSelected ? 'text-rose-200' : 'text-gray-400'}`}>ID: {c.chatId}</div>
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={couriers.length === 0 || sendingStatus || !deliveryItems || deliveryItems.length === 0}
                className="w-full bg-[#58111A] text-white py-3 rounded-xl text-xs font-semibold active:scale-95 transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                <TelegramIcon size={14} className={sendingStatus ? 'animate-bounce' : ''} />
                {sendingStatus ? 'Отправка в Telegram...' : 'Отправить заказ с товарами курьеру'}
              </button>
            </form>

            {/* Список отправок (История) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">История отправок</h3>
              {deliveries.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">История отправок пуста</p>
              ) : (
                deliveries.map(item => (
                  <div key={item.id} className={`p-3.5 rounded-2xl border shadow-sm space-y-2 ${
                    isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Курьер: {item.courierName}</span>
                        <div className="space-y-1">
                          {item.items ? (
                            item.items.map((prod, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {prod.photo && <img src={prod.photo} alt="" className="w-6 h-6 object-cover rounded-md border" />}
                                <span className="font-bold text-xs">{prod.title} ({prod.qty} шт.)</span>
                              </div>
                            ))
                          ) : (
                            <span className="font-bold text-xs">{item.itemTitle} ({item.qty} шт.)</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        item.status && item.status.includes('Доставлено') ? 'bg-emerald-100 text-emerald-800' :
                        item.status && item.status.includes('Возврат') ? 'bg-red-100 text-red-800' :
                        'bg-rose-50 text-[#58111A] border border-rose-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] opacity-80 space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <p>📍 Адрес: {item.address}</p>
                      <p>📞 Тел: {item.clientPhone}</p>
                      {item.comment && <p>💬 Комментарий: {item.comment}</p>}
                      
                      <div className="flex justify-between items-center pt-1 mt-1 border-t border-dashed border-gray-200 dark:border-gray-700 text-[10px] opacity-70">
                        <span>📤 Отправлено: {item.sentAt || 'Не указано'}</span>
                        {item.updatedAt && <span>⏱ Ответ: {item.updatedAt}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </section>
        
       </div>
      </main>

      {/* ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ТОВАРА */}
        {productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className={`w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center space-y-4 ${
              isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>

              <div>
                <h3 className="text-sm font-bold">
                  {deleteConfirmationStep === 1 ? 'Первое подтверждение' : 'Подтвердите удаление ещё раз'}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {deleteConfirmationStep === 1
                    ? `Вы собираетесь удалить «${productToDelete.title}». Для продолжения потребуется ещё одно подтверждение.`
                    : `Последнее предупреждение: товар «${productToDelete.title}» будет удалён из каталога. Продолжить?`}
                </p>
                <p className="text-[10px] text-gray-400 mt-2">
                  Товар с остатком на складе удалить нельзя.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmationStep === 1) {
                    setDeleteConfirmationStep(2);
                  } else {
                    confirmDeleteProduct();
                  }
                }}
                className="w-full bg-[#58111A] text-white py-3 rounded-xl text-xs font-bold"
              >
                {deleteConfirmationStep === 1 ? 'Продолжить' : 'Да, окончательно удалить'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteConfirmationStep(1);
                }}
                className="w-full py-2 text-xs text-gray-400 font-semibold"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

      {/* МОДАЛЬНОЕ ОКНО ПРОФИЛЯ И КУРЬЕРОВ */}
      {isAddModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto overscroll-contain p-3">
        <div className={`w-full max-w-sm max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-3xl p-5 shadow-2xl space-y-5 relative animate-scale-up ${
            isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
          }`}>
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className={`absolute top-3.5 right-3.5 p-1.5 rounded-full ${
                isDarkMode ? 'bg-[#2A2A2A] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'
              }`}
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-full bg-[#58111A] text-white font-bold flex items-center justify-center text-lg shadow-inner">
                M
              </div>
              <div>
                <h3 className="font-bold text-sm">Настройки Telegram Бота</h3>
                <p className="text-[10px] text-gray-400">Привязка Chat ID курьеров</p>
              </div>
            </div>

            <form onSubmit={handleAddCourier} className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-[#58111A] uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={14} /> Добавить Chat ID курьера
              </h4>

              <input 
                type="text"
                value={newCourierName}
                onChange={(e) => setNewCourierName(e.target.value)}
                placeholder="Имя курьера (например, Нодир)"
                className={`w-full p-2.5 border rounded-xl text-xs outline-none focus:border-[#58111A] ${
                  isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
              />

              <div className="relative">
                <input 
                  type="text"
                  value={newCourierChatId}
                  onChange={(e) => setNewCourierChatId(e.target.value)}
                  placeholder="Telegram Chat ID (например, 907176273)"
                  className={`w-full pl-7 pr-3 p-2.5 border rounded-xl text-xs outline-none focus:border-[#58111A] ${
                    isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <Key size={13} className="absolute left-2.5 top-3 text-gray-400" />
              </div>

              <button type="submit" className="w-full bg-[#58111A] text-white py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform flex items-center justify-center gap-1.5">
                <Plus size={14} /> Сохранить курьера
              </button>
            </form>

            <div className="space-y-2 pt-2">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Курьеры ({couriers.length})</h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {couriers.map(c => (
                  <div key={c.id} className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
                    isDarkMode ? 'bg-[#252525] border-gray-800' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div>
                      <span className="font-bold">{c.name}</span>
                      <span className="text-[10px] text-rose-400 block">ID: {c.chatId}</span>
                    </div>
                    <button 
                      onClick={() => setCouriers(couriers.filter(item => item.id !== c.id))}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопка включения пуш-уведомлений */}
            <button 
              type="button"
              onClick={subscribeUserToPush}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5 mt-2"
            >
              🔔 Включить пуш-уведомления на этом устройстве
            </button>

            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="w-full bg-gray-200 dark:bg-[#2A2A2A] text-gray-800 dark:text-gray-200 py-2.5 rounded-xl text-xs font-semibold mt-2"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

     {/* МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ТОВАРА */}
{isAddModalOpen && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-5 relative animate-scale-up ${
      isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
    }`}>

      <button
        type="button"
        onClick={handleCancelEdit}
        aria-label="Закрыть окно"
        className={`absolute top-3 right-3 p-2 rounded-full ${
          isDarkMode
            ? 'bg-[#2A2A2A] text-gray-400'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        <X size={17} />
      </button>

      <div className="pr-8">
        <div className="flex items-center gap-2 text-[#8B2635]">
          {editingId ? <Edit3 size={18} /> : <PlusCircle size={18} />}
          <h3 className="text-base font-bold">
            {editingId ? 'Редактировать модель' : 'Новая модель товара'}
          </h3>
        </div>

        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          {editingId
            ? 'Измените название или фотографию товара.'
            : 'Создайте карточку товара. Закупку и количество добавите позже через новую поставку.'}
        </p>
      </div>

      <form onSubmit={handleSubmitProduct} className="space-y-4">

        {/* НАЗВАНИЕ */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">
            Название модели <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            required
              onFocus={(e) => {
                setTimeout(() => {
                  e.target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                }, 300);
             }}

            autoFocus
            maxLength={100}
            value={prodTitle}
            onChange={e => setProdTitle(e.target.value)}
            placeholder="Например: Свитер белый"
            className={`w-full p-3.5 border rounded-xl text-sm outline-none focus:border-[#8B2635] ${
              isDarkMode
                ? 'bg-[#2A2A2A] border-gray-700 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
        </div>

        {/* ФОТОГРАФИЯ */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">
            Фотография товара
          </label>

          <ImageUploader
            onImageUpload={(file) => {
              setSelectedImageFile(file);

              const reader = new FileReader();
              reader.onload = () => setCurrentPhotoPreview(reader.result);
              reader.readAsDataURL(file);
            }}
            currentPreview={currentPhotoPreview}
            isDarkMode={isDarkMode}
          />

          <p className="text-[10px] text-gray-400">
            Фотография необязательна. Можно добавить её позже.
          </p>
        </div>

        {/* ПОЯСНЕНИЕ */}
        {!editingId && (
          <div className={`rounded-xl p-3 flex gap-2.5 ${
            isDarkMode
              ? 'bg-[#252525]'
              : 'bg-rose-50'
          }`}>
            <CheckCircle2
              size={17}
              className="text-[#8B2635] flex-shrink-0 mt-0.5"
            />

            <div>
              <p className="text-xs font-bold">
                Карточка без закупки
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                После создания остаток будет 0 шт. Чтобы добавить товар на склад, оформите новую поставку.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!prodTitle.trim()}
          className="w-full bg-[#58111A] text-white py-3.5 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Check size={16} />
          {editingId ? 'Сохранить изменения' : 'Создать карточку'}
        </button>

        <button
          type="button"
          onClick={handleCancelEdit}
          className="w-full py-2 text-xs text-gray-400 font-semibold"
        >
          Отмена
        </button>

      </form>
    </div>
  </div>
)}

      
        {showBatchDraftChoice && (
          <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-3 ${isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'}`}>
              <h3 className="text-base font-bold">Найден черновик поставки</h3>
              <p className="text-sm text-gray-500">Можно продолжить с шага {readBatchDraft()?.batchStep || 1} или начать новую поставку.</p>
              <button
                type="button"
                onClick={() => {
                  const draft = readBatchDraft();
                  if (draft) {
                    setBatchItems(draft.batchItems || []);
                    setBatchNotes(draft.batchNotes || '');
                    setBatchName(draft.batchName || '');
                    setBatchStep(draft.batchStep || 1);
                    setBatchNewProductTitle(draft.batchNewProductTitle || '');
                    setBatchNewProductPhoto(draft.batchNewProductPhoto || '');
                    setShowBatchProductCreation(Boolean(draft.showBatchProductCreation));
                  }
                  setShowBatchDraftChoice(false);
                  setIsBatchModalOpen(true);
                }}
                className="w-full bg-[#58111A] text-white py-3 rounded-xl text-sm font-bold"
              >
                Продолжить черновик
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(BATCH_DRAFT_KEY);
                  setBatchItems([]);
                  setBatchNotes('');
                  setBatchName(`Поставка от ${new Date().toLocaleDateString('ru-RU')}`);
                  setBatchNewProductTitle('');
                  setBatchNewProductPhoto('');
                  setBatchStep(1);
                  setShowBatchVariants(false);
                  setShowBatchProductCreation(false);
                  setShowBatchDraftChoice(false);
                  setIsBatchModalOpen(true);
                }}
                className={`w-full py-3 rounded-xl text-sm font-semibold ${isDarkMode ? 'bg-[#303030]' : 'bg-gray-100'}`}
              >
                Новая поставка
              </button>
              <button
                type="button"
                onClick={() => setShowBatchDraftChoice(false)}
                className="w-full py-2 text-xs text-gray-400"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО ПОШАГОВОЙ ПОСТАВКИ */}
        {isBatchModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl p-5 shadow-2xl space-y-6 ${
              isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
            }`}>

              {/* Заголовок */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Новая поставка</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Последовательно заполните информацию
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="text-gray-400 text-2xl px-2"
                >
                  ×
                </button>
              </div>

              {/* Прогресс */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold">Шаг {batchStep} из 5</span>
                  <span className="text-gray-400">
                    {Math.round((batchStep / 5) * 100)}%
                  </span>
                </div>

                <div className={`h-2 rounded-full overflow-hidden ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div
                    className="h-full bg-[#8B2635] rounded-full transition-all"
                    style={{ width: `${(batchStep / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Шаг 1 */}
              {batchStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold">
                      Название поставки
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Укажите понятное название для учёта закупки
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2">
                      Название
                    </label>

                    <input
                      type="text"
                      value={batchName}
                      onChange={e => setBatchName(e.target.value)}
                      placeholder="Например, Поставка от 05.11.2026"
                      maxLength={100}
                      className={batchInputClass}
                    />
                  </div>

                  <div className={`rounded-xl p-3 text-xs ${
                    isDarkMode
                      ? 'bg-[#252525] text-gray-400'
                      : 'bg-rose-50 text-gray-500'
                  }`}>
                    Название можно изменить. Оно поможет быстро найти поставку
                    в истории закупок.
                  </div>

                  <button
                    type="button"
                    disabled={!batchName.trim()}
                    onClick={() => setBatchStep(2)}
                    className="w-full bg-[#58111A] text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-40"
                  >
                    Далее
                  </button>
                </div>
              )}

              
              {/* ШАГ 2 — ВЫБОР ТОВАРА */}
{batchStep === 2 && (
  <div className="space-y-4">

    <div>
      <h3 className="text-base font-bold">Выбор товара</h3>
      <p className="text-xs text-gray-400 mt-1">
        Выберите модель из каталога или создайте новую
      </p>
    </div>

    {!showBatchProductCreation ? (
      <>
        <div className="space-y-2 max-h-64 overflow-y-auto">

          {products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-5">
              Каталог пока пуст
            </p>
          ) : (
            products.map(product => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setBatchItems(prev => {
                    // Убираем пустые позиции
                    const selectedItems = prev.filter(
                      item => item.productId
                    );

                    const exists = selectedItems.some(
                      item => String(item.productId) === String(product.id)
                    );

                    if (exists) {
                      return selectedItems.filter(
                        item => String(item.productId) !== String(product.id)
                      );
                    }

                    const newItem = createEmptyBatchItem();
                    newItem.productId = String(product.id);
                    newItem.productTitle = product.title;
                    newItem.productPhoto = product.photo || '';

                    return [...selectedItems, newItem];
                  });
                }}

                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
                  batchItems.some(
                      item => String(item.productId) === String(product.id)
                    )
                    ? 'border-[#8B2635] bg-rose-50'
                    : isDarkMode
                      ? 'border-gray-700 bg-[#252525]'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <img
                  src={product.photo}
                  alt={product.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {product.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    Остаток: {product.quantity || 0} шт.
                  </p>
                </div>

                {batchItems.some(
                 item => String(item.productId) === String(product.id)
                  ) && (
                  <Check size={18} className="text-[#8B2635]" />
                )}
              </button>
            ))
          )}

        </div>

        <button
          type="button"
          onClick={() => setShowBatchProductCreation(true)}
          className={`w-full border border-dashed rounded-xl p-4 flex items-center justify-center gap-2 text-sm font-semibold ${
            isDarkMode
              ? 'border-gray-600 text-rose-300'
              : 'border-rose-300 text-[#8B2635]'
          }`}
        >
          <PlusCircle size={18} />
          Создать новую модель
        </button>
      </>
    ) : (
      <div className="space-y-3">

        <div>
          <label className="block text-xs font-semibold mb-2">
            Название модели
          </label>

          <input
            type="text"
            value={batchNewProductTitle}
            onChange={e => setBatchNewProductTitle(e.target.value)}
            placeholder="Например: Кроссовки белые"
            maxLength={100}
            className={batchInputClass}
          />
        </div>

        <div>
  <label className="block text-xs font-semibold mb-2">
    Фотография товара
  </label>

  <label
    className={`relative flex flex-col items-center justify-center w-full min-h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
      isDarkMode
        ? 'border-gray-600 bg-[#252525] hover:border-rose-400'
        : 'border-rose-200 bg-rose-50 hover:border-[#8B2635]'
    }`}
  >
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={e => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          setModalAlert({
            title: 'Неверный формат',
            message: 'Выберите файл изображения.',
            type: 'error'
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          setBatchNewProductPhoto(reader.result);
        };
        reader.readAsDataURL(file);
      }}
    />

    {batchNewProductPhoto ? (
      <>
        <img
          src={batchNewProductPhoto}
          alt="Фото товара"
          className="w-full h-40 object-contain"
        />

        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-3 py-1.5 rounded-lg">
          Изменить фото
        </span>
      </>
    ) : (
      <div className="flex flex-col items-center py-6 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-3">
          <ImageIcon size={23} className="text-[#8B2635]" />
        </div>

        <p className="text-sm font-bold">
          Добавить фотографию
        </p>

        <p className="text-[11px] text-gray-400 mt-1">
          Нажмите, чтобы выбрать из галереи
        </p>

        <p className="text-[10px] text-gray-400 mt-2">
          JPG, PNG или WEBP
        </p>
      </div>
    )}
  </label>

  <p className="text-[10px] text-gray-400 mt-2">
    Фотография необязательна. Её можно добавить позже.
  </p>
</div>

        <button
          type="button"
          onClick={() => setShowBatchProductCreation(false)}
          className="w-full py-2 text-xs text-gray-400 font-semibold"
        >
          Назад к каталогу
        </button>

      </div>
    )}

    <div className="flex gap-2 pt-2">

      <button
        type="button"
        onClick={() => setBatchStep(1)}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold ${
          isDarkMode ? 'bg-[#303030]' : 'bg-gray-100'
        }`}
      >
        Назад
      </button>

      <button
        type="button"
        disabled={showBatchProductCreation
          ? !batchNewProductTitle.trim()
          : !batchItems.some(item => item.productId)}
        onClick={() => {
          if (showBatchProductCreation) {
            handleCreateBatchProduct();
            setBatchStep(3);
            return;
          }
          setBatchStep(3);
        }}
        className="flex-1 bg-[#58111A] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40"
      >
        Далее
      </button>

    </div>

  </div>
)}


{/* ШАГ 3 — КОЛИЧЕСТВО ТОВАРА */}

{batchStep === 3 && batchItems.length > 0 && (() => {
  const allItemsValid = batchItems.every(item => {
    const quantity = Number(item.quantity);
    const variants = item.variants || [];

    const variantsTotal = variants.length
      ? variants.reduce((sum, variant) => sum + (Number(variant.quantity) || 0), 0)
      : quantity;

    return (
      Number.isInteger(quantity) &&
      quantity > 0 &&
      (
        variants.length === 0 ||
        (
          variants.every(variant =>
            String(variant.color || '').trim() &&
            String(variant.size || '').trim() &&
            Number.isInteger(Number(variant.quantity)) &&
            Number(variant.quantity) >= 0
          ) &&
          variantsTotal === quantity
        )
      )
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold">
          Количество, цвета и размеры
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Настройте каждую модель отдельно
        </p>
      </div>

      {batchItems.map((item, itemIndex) => {
        const product = products.find(
          p => String(p.id) === String(item.productId) || String(p.legacyId || '') === String(item.productId)
        ) || (item.productTitle ? {
          title: item.productTitle,
          photo: item.productPhoto || ''
        } : null);

        const variants = item.variants || [];

        const quantity = Number(item.quantity) || 0;

        const variantsTotal = variants.length
          ? variants.reduce((sum, variant) => sum + (Number(variant.quantity) || 0), 0)
          : quantity;

        const isValid =
          Number.isInteger(Number(item.quantity)) &&
          quantity > 0 &&
          (
            variants.length === 0 ||
            (
              variants.every(variant =>
                String(variant.color || '').trim() &&
                String(variant.size || '').trim() &&
                Number.isInteger(Number(variant.quantity)) &&
                Number(variant.quantity) >= 0
              ) &&
              variantsTotal === quantity
            )
          );

        return (
          <div
            key={`${item.productId}-${itemIndex}`}
            className={`rounded-2xl border p-4 space-y-4 ${
              isDarkMode
                ? 'border-gray-700 bg-[#252525]'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div>
              <p className="text-xs text-gray-400">
                Модель {itemIndex + 1}
              </p>
              <h4 className="font-bold text-sm mt-1">
                {product?.title || 'Товар'}
              </h4>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Общее количество
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                onChange={e => {
                  const value = e.target.value;

                  setBatchItems(prev =>
                    prev.map((current, index) => {
                      if (index !== itemIndex) return current;

                      const updatedVariants = [
                        ...(current.variants || [])
                      ];

                      if (updatedVariants.length === 1) {
                        updatedVariants[0] = {
                          ...updatedVariants[0],
                          quantity: value
                        };
                      }

                      return {
                        ...current,
                        quantity: value,
                        variants: updatedVariants
                      };
                    })
                  );
                }}
                placeholder="Например, 50"
                className={batchInputClass}
              />
            </div>

            <div>
              <div className="mb-3">
                <h5 className="text-sm font-bold">
                  Цвета и размеры
                </h5>
                <p className="text-xs text-gray-400 mt-1">
                  Укажите количество для каждого варианта
                </p>
              </div>

              {variants.length === 0 && (
                <div className={`rounded-xl border border-dashed p-3 mb-3 text-xs ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                  Цвета и размеры не указаны. Это допустимо — всё количество будет записано как обычный товар без вариантов.
                </div>
              )}

              {variants.map((variant, variantIndex) => (
                <div
                  key={variantIndex}
                  className={`rounded-xl border p-3 mb-3 space-y-3 ${
                    isDarkMode
                      ? 'border-gray-700 bg-[#1E1E1E]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">
                      Вариант {variantIndex + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeBatchVariant(itemIndex, variantIndex)}
                      className="text-red-500 text-xs flex items-center gap-1"
                    >
                      <Trash2 size={15} />
                      Убрать
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] mb-1">
                        Цвет
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={e =>
                          updateBatchVariant(
                            itemIndex,
                            variantIndex,
                            'color',
                            e.target.value
                          )
                        }
                        placeholder="Чёрный"
                        className={batchInputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] mb-1">
                        Размер
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={e =>
                          updateBatchVariant(
                            itemIndex,
                            variantIndex,
                            'size',
                            e.target.value
                          )
                        }
                        placeholder="XL"
                        className={batchInputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] mb-1">
                      Количество
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={variant.quantity}
                      onChange={e =>
                        updateBatchVariant(
                          itemIndex,
                          variantIndex,
                          'quantity',
                          e.target.value
                        )
                      }
                      className={batchInputClass}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addBatchVariant(itemIndex)}
                className="w-full py-3 rounded-xl border border-dashed border-[#8B2635] text-[#8B2635] text-xs font-semibold"
              >
                <Plus size={14} className="inline mr-1" />
                Добавить цвет или размер
              </button>
            </div>

            <div className={`rounded-xl p-3 text-xs ${
              isValid
                ? 'bg-green-50 text-green-700'
                : 'bg-rose-50 text-[#8B2635]'
            }`}>
              Распределено: {variantsTotal} из {quantity} шт.

              {!isValid && (
                <p className="mt-1">
                  Проверьте количество, цвета и размеры.
                  Сумма вариантов должна совпадать с общим количеством.
                </p>
              )}
            </div>
          </div>
        );
      })}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setBatchStep(2)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold ${
            isDarkMode ? 'bg-[#303030]' : 'bg-gray-100'
          }`}
        >
          Назад
        </button>

        <button
          type="button"
          disabled={!allItemsValid}
          onClick={() => setBatchStep(4)}
          className="flex-1 bg-[#58111A] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40"
        >
          Далее
        </button>
      </div>
    </div>
  );
})()}


{/* ШАГ 4 — РАСХОДЫ */}

{batchStep === 4 && batchItems.length > 0 && (() => {
  const allItemsValid = batchItems.every(item =>
    item.wholesaleAmount !== '' &&
    item.cargoAmount !== '' &&
    Number.isFinite(Number(item.wholesaleAmount)) &&
    Number.isFinite(Number(item.cargoAmount)) &&
    Number(item.wholesaleAmount) >= 0 &&
    Number(item.cargoAmount) >= 0
  );

  const totalCost = batchItems.reduce(
    (sum, item) =>
      sum + calculateBatchItemCost(item) * Number(item.quantity),
    0
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold">
          Расходы на закупку
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Укажите закупочную стоимость и карго для каждой модели
        </p>
      </div>

      {batchItems.map((item, itemIndex) => {
        const product = products.find(
          p => String(p.id) === String(item.productId) || String(p.legacyId || '') === String(item.productId)
        );

        const validAmounts =
          item.wholesaleAmount !== '' &&
          item.cargoAmount !== '' &&
          Number.isFinite(Number(item.wholesaleAmount)) &&
          Number.isFinite(Number(item.cargoAmount)) &&
          Number(item.wholesaleAmount) >= 0 &&
          Number(item.cargoAmount) >= 0;

        const unitCost = calculateBatchItemCost(item);

        const updateField = (field, value) => {
          updateBatchItem(itemIndex, field, value);
        };

        return (
          <div
            key={`${item.productId}-${itemIndex}`}
            className={`rounded-2xl border p-4 space-y-5 ${
              isDarkMode
                ? 'border-gray-700 bg-[#252525]'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div>
              <p className="text-xs text-gray-400">
                Модель {itemIndex + 1}
              </p>
              <h4 className="font-bold text-sm mt-1">
                {product?.title || 'Товар'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Количество: {item.quantity} шт.
              </p>
            </div>

            {/* ЗАКУПОЧНАЯ СУММА */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Общая сумма закупки
              </label>

              <div className={`flex items-center border rounded-xl overflow-hidden ${
                isDarkMode
                  ? 'border-gray-700 bg-[#2A2A2A]'
                  : 'border-gray-200 bg-white'
              }`}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.wholesaleAmount}
                  onChange={e =>
                    updateField('wholesaleAmount', e.target.value)
                  }
                  placeholder="Например, 500"
                  className="flex-1 min-w-0 px-3 py-3 text-sm outline-none bg-transparent"
                />

                <div className="flex items-center gap-1 p-1">
                  {['CNY', 'USD', 'TJS'].map(currency => (
                    <button
                      key={currency}
                      type="button"
                      onClick={() =>
                        updateField('wholesaleCurrency', currency)
                      }
                      className={`px-2.5 py-2 rounded-lg text-[10px] font-bold ${
                        item.wholesaleCurrency === currency
                          ? 'bg-[#58111A] text-white'
                          : isDarkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* КАРГО */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Стоимость карго для этой модели
              </label>

              <div className={`flex items-center border rounded-xl overflow-hidden ${
                isDarkMode
                  ? 'border-gray-700 bg-[#2A2A2A]'
                  : 'border-gray-200 bg-white'
              }`}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cargoAmount}
                  onChange={e =>
                    updateField('cargoAmount', e.target.value)
                  }
                  placeholder="Например, 100"
                  className="flex-1 min-w-0 px-3 py-3 text-sm outline-none bg-transparent"
                />

                <div className="flex items-center gap-1 p-1">
                  {['CNY', 'USD', 'TJS'].map(currency => (
                    <button
                      key={currency}
                      type="button"
                      onClick={() =>
                        updateField('cargoCurrency', currency)
                      }
                      className={`px-2.5 py-2 rounded-lg text-[10px] font-bold ${
                        item.cargoCurrency === currency
                          ? 'bg-[#58111A] text-white'
                          : isDarkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ЦЕНА ПРОДАЖИ */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold">
                Цена продажи за 1 штуку
                <span className="text-gray-400 font-normal">
                  {' '}— необязательно
                </span>
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.salePriceTjs}
                  onChange={e =>
                    updateField('salePriceTjs', e.target.value)
                  }
                  placeholder="Например, 250"
                  className={batchInputClass}
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  TJS
                </span>
              </div>
            </div>

            {/* СЕБЕСТОИМОСТЬ */}
            <div className={`rounded-xl p-4 space-y-3 ${
              isDarkMode
                ? 'bg-[#1E1E1E] border border-gray-700'
                : 'bg-rose-50 border border-rose-100'
            }`}>
              <div>
                <p className="text-xs text-gray-500">
                  Себестоимость одной единицы
                </p>
                <p className="text-2xl font-bold text-[#8B2635] mt-1">
                  {validAmounts
                    ? unitCost.toFixed(2)
                    : '—'} сомони
                </p>
              </div>

              <div className="border-t border-gray-300/40 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Количество
                  </span>
                  <span className="font-semibold">
                    {item.quantity} шт.
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Общие расходы модели
                  </span>
                  <span className="font-semibold">
                    {validAmounts
                      ? (unitCost * Number(item.quantity)).toFixed(2)
                      : '—'} TJS
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ОБЩАЯ СУММА */}
      <div className={`rounded-2xl p-4 ${
        isDarkMode
          ? 'bg-[#303030]'
          : 'bg-gray-100'
      }`}>
        <p className="text-xs text-gray-500">
          Общие расходы всей поставки
        </p>
        <p className="text-2xl font-bold mt-1">
          {allItemsValid
            ? totalCost.toFixed(2)
            : '—'} сомони
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => setBatchStep(3)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold ${
            isDarkMode ? 'bg-[#303030]' : 'bg-gray-100'
          }`}
        >
          Назад
        </button>

        <button
          type="button"
          disabled={!allItemsValid}
          onClick={() => setBatchStep(5)}
          className="flex-1 bg-[#58111A] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40"
        >
          Далее
        </button>
      </div>
    </div>
  );
})()}




{/* ШАГ 5 — ПРОВЕРКА ПОСТАВКИ */}

{batchStep === 5 && batchItems.length > 0 && (() => {
  const formatMoney = (amount, currency) => {
    const symbols = {
      CNY: '¥',
      USD: '$',
      TJS: 'SM'
    };

    return `${amount} ${symbols[currency] || currency}`;
  };

  const totalQuantity = batchItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const totalCost = batchItems.reduce(
    (sum, item) =>
      sum + calculateBatchItemCost(item) * Number(item.quantity),
    0
  );

  const allItemsValid = batchItems.every(item => {
    const quantity = Number(item.quantity);
    const variants = item.variants || [];

    const variantsTotal = variants.length
      ? variants.reduce((sum, variant) => sum + (Number(variant.quantity) || 0), 0)
      : quantity;

    return (
      item.productId &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      (
        variants.length === 0 ||
        (
          variants.every(variant =>
            String(variant.color || '').trim() &&
            String(variant.size || '').trim() &&
            Number.isInteger(Number(variant.quantity)) &&
            Number(variant.quantity) >= 0
          ) &&
          variantsTotal === quantity
        )
      ) &&
      item.wholesaleAmount !== '' &&
      item.cargoAmount !== '' &&
      Number.isFinite(Number(item.wholesaleAmount)) &&
      Number.isFinite(Number(item.cargoAmount)) &&
      Number(item.wholesaleAmount) >= 0 &&
      Number(item.cargoAmount) >= 0
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold">
          Проверьте поставку
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Проверьте все модели перед принятием на склад
        </p>
      </div>

      {/* НАЗВАНИЕ ПОСТАВКИ */}
      <div className={`rounded-xl p-3 ${
        isDarkMode ? 'bg-[#252525]' : 'bg-gray-50'
      }`}>
        <p className="text-[11px] text-gray-400">
          Название поставки
        </p>
        <p className="text-sm font-bold mt-1">
          {batchName}
        </p>
      </div>

      {/* ВСЕ МОДЕЛИ */}
      <div className="space-y-3">
        <p className="text-xs font-bold">
          Товары в поставке ({batchItems.length})
        </p>

        {batchItems.map((item, itemIndex) => {
          const product = products.find(
            p => String(p.id) === String(item.productId) || String(p.legacyId || '') === String(item.productId)
          ) || (item.productTitle ? {
            title: item.productTitle,
            photo: item.productPhoto || ''
          } : null);

          const quantity = Number(item.quantity) || 0;
          const unitCost = calculateBatchItemCost(item);
          const itemTotalCost = unitCost * quantity;

          const variants = item.variants || [];

          return (
            <div
              key={`${item.productId}-${itemIndex}`}
              className={`rounded-xl border p-3 space-y-3 ${
                isDarkMode
                  ? 'border-gray-700 bg-[#252525]'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={product?.photo}
                  alt={product?.title || 'Товар'}
                  className="w-14 h-14 rounded-xl object-cover"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {product?.title || 'Товар не найден'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {quantity} шт.
                  </p>
                </div>
              </div>

              {/* ВАРИАНТЫ */}
              <div className="space-y-2">
                <p className="text-xs font-semibold">
                  Цвета и размеры
                </p>

                {variants.length === 0 && (
                  <p className="text-xs text-gray-500">Без вариантов — {quantity} шт. обычного товара</p>
                )}
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center rounded-lg p-2 text-xs ${
                      isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'
                    }`}
                  >
                    <span>
                      {variant.color} / {variant.size}
                    </span>
                    <span className="font-bold">
                      {variant.quantity} шт.
                    </span>
                  </div>
                ))}
              </div>

              {/* ФИНАНСЫ */}
              <div className="border-t border-gray-300/30 pt-3 space-y-2">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400">
                    Закупка
                  </span>
                  <span className="font-semibold">
                    {formatMoney(
                      Number(item.wholesaleAmount),
                      item.wholesaleCurrency
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400">
                    Карго
                  </span>
                  <span className="font-semibold">
                    {formatMoney(
                      Number(item.cargoAmount),
                      item.cargoCurrency
                    )}
                  </span>
                </div>

                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400">
                    Цена продажи за штуку
                  </span>
                  <span className="font-semibold">
                    {item.salePriceTjs === ''
                      ? 'Не указана'
                      : `${Number(item.salePriceTjs).toFixed(2)} TJS`}
                  </span>
                </div>

                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400">
                    Себестоимость 1 шт.
                  </span>
                  <span className="font-bold">
                    {unitCost.toFixed(2)} TJS
                  </span>
                </div>

                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400">
                    Всего по модели
                  </span>
                  <span className="font-bold text-[#8B2635]">
                    {itemTotalCost.toFixed(2)} TJS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ОБЩИЙ ИТОГ */}
      <div className={`rounded-2xl p-4 space-y-3 ${
        isDarkMode
          ? 'bg-[#252525] border border-gray-700'
          : 'bg-rose-50 border border-rose-100'
      }`}>
        <p className="text-xs text-gray-500">
          Итог всей поставки
        </p>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">
            Количество моделей
          </span>
          <span className="font-bold">
            {batchItems.length}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">
            Всего единиц
          </span>
          <span className="font-bold">
            {totalQuantity} шт.
          </span>
        </div>

        <div className="border-t border-gray-300/40 pt-3">
          <p className="text-xs text-gray-500">
            Общие расходы поставки
          </p>
          <p className="text-2xl font-bold text-[#8B2635] mt-1">
            {totalCost.toFixed(2)} сомони
          </p>
        </div>
      </div>

      {/* ПРЕДУПРЕЖДЕНИЕ */}
      <div className="rounded-xl bg-amber-50 text-amber-800 p-3 text-xs">
        После подтверждения все модели и их варианты будут отправлены
        на сервер и зарегистрированы в системе.
      </div>

      {/* КНОПКИ */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          disabled={batchSaving}
          onClick={() => setBatchStep(4)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold ${
            isDarkMode ? 'bg-[#303030]' : 'bg-gray-100'
          }`}
        >
          Назад
        </button>

        <button
          type="button"
          disabled={batchSaving || !allItemsValid}
          onClick={() => handleSavePurchaseBatch()}
          className="flex-1 bg-[#58111A] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {batchSaving ? (
            'Сохранение...'
          ) : (
            <>
              <Check size={16} />
              Принять на склад
            </>
          )}
        </button>
      </div>
    </div>
  );
})()}



            </div>
          </div>
        )}



      {isSupportOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-3">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] ${isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'}`}>
            <div className="bg-[#58111A] text-white px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Служба поддержки</h3>
                  <p className="text-[11px] text-rose-200">Напишите нам — мы ответим</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsSupportOpen(false)} className="p-2 rounded-xl hover:bg-white/10" aria-label="Закрыть чат">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-[220px] space-y-3">
              <div className={`rounded-2xl rounded-tl-sm p-3 text-sm max-w-[90%] ${isDarkMode ? 'bg-[#303030]' : 'bg-rose-50'}`}>
                Здравствуйте! Опишите ваш вопрос. Сообщение поступит в службу поддержки Mekha Shop.
              </div>
              {supportHistory.map((item) => (
                <div key={item.id} className={`flex ${item.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl p-3 text-sm break-words ${item.sender === 'client' ? 'rounded-tr-sm bg-[#58111A] text-white' : (isDarkMode ? 'rounded-tl-sm bg-[#303030] text-white' : 'rounded-tl-sm bg-rose-50 text-gray-900')}`}>
                    {item.text}
                    <p className={`text-[10px] mt-1 ${item.sender === 'client' ? 'text-rose-200' : 'text-gray-400'}`}>
                      {item.sender === 'client' ? 'Вы' : 'Служба поддержки'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form
              className={`p-3 border-t flex items-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
              onSubmit={async (e) => {
                e.preventDefault();
                const text = supportMessage.trim();
                if (!text || supportSending) return;
                setSupportSending(true);
                try {
                  const response = await fetch(`${BACKEND_URL}/api/support-message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, clientId: supportClientId })
                  });
                  const result = await response.json().catch(() => ({}));
                  if (!response.ok) throw new Error(result.error || 'Не удалось отправить сообщение');
                  setSupportMessage('');
                  setSupportMessage('');
                } catch (error) {
                  setModalAlert({ title: 'Ошибка отправки', message: error.message || 'Попробуйте ещё раз.', type: 'error' });
                } finally {
                  setSupportSending(false);
                }
              }}
            >
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                rows={2}
                maxLength={2000}
                className={`flex-1 resize-none rounded-2xl px-3 py-2.5 text-sm outline-none border ${isDarkMode ? 'bg-[#2A2A2A] border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              />
              <button
                type="submit"
                disabled={!supportMessage.trim() || supportSending}
                className="w-11 h-11 shrink-0 rounded-2xl bg-[#58111A] text-white flex items-center justify-center disabled:opacity-40"
                aria-label="Отправить сообщение"
              >
                {supportSending ? <RefreshCw size={17} className="animate-spin" /> : <TelegramIcon size={18} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Нижняя навигация */}
      <nav className={`flex justify-around items-center border-t h-20 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 shadow-lg px-2 transition-colors ${
        isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
      }`}>
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 ease-out ${
            activeTab === 'home'
              ? '-translate-y-2 text-rose-500 font-bold'
              : 'translate-y-0 text-gray-400'
          }`}
        >
          <Home size={25} />
          <span className="text-[10px] mt-1">Главная</span>
        </button>

        <button 
          onClick={() => setActiveTab('products')} 
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 ease-out ${
            activeTab === 'products'
              ? '-translate-y-2 text-rose-500 font-bold'
              : 'translate-y-0 text-gray-400'
          }`}
        >
          <ShoppingBag size={25} />
          <span className="text-[10px] mt-1">Товары</span>
        </button>

        {/* ЦЕНТРАЛЬНАЯ КНОПКА + */}
        <div className="flex-1 flex justify-center -mt-8">
          <button
            type="button"
              onClick={() => {
                setIsQuickAddMenuOpen(false);
                const savedDraft = readBatchDraft();
                if (savedDraft) {
                  setShowBatchDraftChoice(true);
                  return;
                }
                setBatchItems([]);
                setBatchNotes('');
                setBatchName(`Поставка от ${new Date().toLocaleDateString('ru-RU')}`);
                setBatchNewProductTitle('');
                setBatchNewProductPhoto('');
                setBatchStep(1);
                setShowBatchVariants(false);
                setShowBatchProductCreation(false);
                setIsBatchModalOpen(true);
              }}
            className={`w-16 h-16 rounded-full bg-[#58111A] text-white flex items-center justify-center shadow-xl border-4 active:scale-95 transition-transform ${
              isDarkMode ? 'border-[#121212]' : 'border-[#FAF8F5]'
            }`}
          >
            {isQuickAddMenuOpen ? <X size={44} /> : <Plus size={36} />}
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('calc')} 
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 ease-out ${
            activeTab === 'calc'
              ? '-translate-y-2 text-rose-500 font-bold'
              : 'translate-y-0 text-gray-400'
          }`}
        >
          <Calculator size={25} />
          <span className="text-[10px] mt-1">Расчет</span>
        </button>

        <button 
          onClick={() => setActiveTab('courier')} 
          className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-300 ease-out ${
            activeTab === 'courier'
              ? '-translate-y-2 text-rose-500 font-bold'
              : 'translate-y-0 text-gray-400'
          }`}
        >
          <Truck size={25} />
          <span className="text-[10px] mt-1">Курьер</span>
        </button>
      </nav>

    </div>
  );
}
