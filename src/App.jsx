import { useState, useEffect, useRef } from 'react';
import { Calculator, ShoppingBag, RefreshCw, PlusCircle, Trash2, Home, Image as ImageIcon, Upload, Edit3, Check, X, Eye, AlertTriangle, Plus, Search, Truck, Moon, Sun, TrendingUp, TrendingDown, Wallet, User, Phone, Send as TelegramIcon, Key, MapPin, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

// --- КОНФИГУРАЦИЯ БОТА И СЕРВЕРА ---
const BACKEND_URL = "https://mekha-server.onrender.com"; // Ваша ссылка с Render

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
  
  // Кастомное уведомление
  const [modalAlert, setModalAlert] = useState(null);

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

  // КАТАЛОГ ТОВАРОВ
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('mekha_products');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: 'Свитер белый',
        photo: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
        quantity: 5,
        totalWholesale: 590,
        wholesaleCurrency: 'TJS',
        cargoCost: 300,
        cargoCurrency: 'CNY',
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mekha_products', JSON.stringify(products));
  }, [products]);

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

        // Списываем склад только при подтверждённой доставке.
        if (event.type === 'DELIVERED' && order.items?.length) {
          setProducts(prevProducts => {
            const nextProducts = prevProducts.map(product => {
              const orderedQty = order.items
                .filter(item =>
                  item.productId != null &&
                  String(item.productId) === String(product.id)
                )
                .reduce(
                  (sum, item) => sum + (Number(item.qty) || 0),
                  0
                );

              if (orderedQty <= 0) return product;

              return {
                ...product,
                quantity: Math.max(
                  0,
                  Number(product.quantity || 0) - orderedQty
                )
              };
            });

            localStorage.setItem(
              'mekha_products',
              JSON.stringify(nextProducts)
            );

            return nextProducts;
          });
        }

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
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
 const [batchNotes, setBatchNotes] = useState('');
 const [batchItems, setBatchItems] = useState([]);
 const [batchSaving, setBatchSaving] = useState(false);

  // ПОШАГОВОЕ ОФОРМЛЕНИЕ ПОСТАВКИ
  const [batchStep, setBatchStep] = useState(1);
  const [batchName, setBatchName] = useState('');
  const [showBatchVariants, setShowBatchVariants] = useState(false);
  const [batchNewProductTitle, setBatchNewProductTitle] = useState('');

  const createEmptyBatchItem = () => ({
    productId: '',
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
    e.preventDefault();

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
      const product = products.find(
        p => String(p.id) === String(item.productId)
      );

      if (!product) {
        setModalAlert({
          title: 'Ошибка',
          message: 'Выберите существующую модель из каталога.',
          type: 'error'
        });
        return;
      }

      const quantity = Number(item.quantity);
      const variantsTotal = item.variants.reduce(
        (sum, variant) => sum + Number(variant.quantity || 0),
        0
      );

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        variantsTotal !== quantity
      ) {
        setModalAlert({
          title: 'Проверьте количество',
          message: `Количество вариантов модели «${product.title}» должно совпадать с общим количеством.`,
          type: 'error'
        });
        return;
      }

      const wholesaleAmount = Number(item.wholesaleAmount);
      const cargoAmount = Number(item.cargoAmount);
      const salePrice = Number(item.salePriceTjs);

      const wholesaleRate = getCurrencyRateToTJS(item.wholesaleCurrency);
      const cargoRate = getCurrencyRateToTJS(item.cargoCurrency);

      if (
        item.wholesaleAmount === '' ||
        item.cargoAmount === '' ||
        item.salePriceTjs === '' ||
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
        legacyId: String(product.id),
        title: product.title,
        photo: null,
        quantity,
        wholesaleAmount: Number(item.wholesaleAmount),
        wholesaleCurrency: item.wholesaleCurrency,
        wholesaleRateToTjs: getCurrencyRateToTJS(item.wholesaleCurrency),
        cargoAmount: Number(item.cargoAmount),
        cargoCurrency: item.cargoCurrency,
        cargoRateToTjs: getCurrencyRateToTJS(item.cargoCurrency),
        salePriceTjs: Number(item.salePriceTjs),
        variants: item.variants.map(variant => ({
          color: variant.color,
          size: variant.size,
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
            notes: batchNotes,
            items: payloadItems
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Не удалось сохранить партию');
      }

      setBatchItems([]);
      setBatchNotes('');
      setIsBatchModalOpen(false);

      setModalAlert({
        title: 'Партия сохранена',
        message: `Закупочная партия №${data.batchNumber} успешно зарегистрирована. Себестоимость рассчитана сервером.`,
        type: 'success'
      });

    } catch (error) {
      setModalAlert({
        title: 'Ошибка сохранения',
        message: error.message || 'Не удалось связаться с сервером.',
        type: 'error'
      });
    } finally {
      setBatchSaving(false);
    }
  };
  
  const handleSubmitProduct = (e) => {
  e.preventDefault();

  const cleanTitle = prodTitle.trim();

  if (!cleanTitle) {
    setModalAlert({
      title: 'Укажите название',
      message: 'Введите название модели товара, чтобы сохранить карточку.',
      type: 'error'
    });
    return;
  }

  if (editingId) {
    // При редактировании меняем только название и фотографию.
    // Остатки и финансовые данные не затрагиваем.
    setProducts(prev =>
      prev.map(product =>
        product.id === editingId
          ? {
              ...product,
              title: cleanTitle,
              photo: currentPhotoPreview || product.photo
            }
          : product
      )
    );
  } else {
    
    // Новая модель создаётся без закупки и без складского остатка.
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
    title: editingId ? 'Изменения сохранены' : 'Модель добавлена',
    message: editingId
      ? 'Название и фотография товара обновлены.'
      : 'Модель добавлена в каталог. Чтобы получить складской остаток, зарегистрируйте новую поставку.',
    type: 'success'
  });
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

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      if (editingId === productToDelete.id) handleCancelEdit();
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
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
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="bg-black/30 p-2 rounded-xl text-rose-100 active:scale-95 transition-transform"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button 
            onClick={fetchRates} 
            disabled={loading}
            className="bg-black/30 p-2 rounded-xl text-rose-100 active:scale-95 transition-transform"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-rose-300' : ''} />
          </button>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 p-3 pb-24 space-y-4 overflow-y-auto">

        {/* ГЛАВНЫЙ ЭКРАН */}
        {activeTab === 'home' && (
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
        )}

        {/* ТОВАРЫ */}
        {activeTab === 'products' && (
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
            
              <button
                onClick={() => {
                  setBatchItems([createEmptyBatchItem()]);
                  setBatchNotes('');
                  setIsBatchModalOpen(true);
                }}
                className="w-full bg-[#58111A] text-white py-3 rounded-xl text-xs font-bold shadow-md active:scale-[0.98]"
              >
                + Принять новую закупочную партию
              </button>
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
                      className={`flex h-[104px] overflow-hidden rounded-2xl border shadow-sm ${
                        isDarkMode
                          ? 'bg-[#1E1E1E] border-gray-800'
                          : 'bg-white border-rose-100'
                      } ${
                        editingId === p.id ? 'ring-1 ring-rose-400' : ''
                      }`}
                    >
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
                              onClick={() => setProductToDelete(p)}
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
        )}

        {/* КАЛЬКУЛЯТОР */}
        {activeTab === 'calc' && (
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
        )}

        {/* РАЗДЕЛ КУРЬЕР / ОТПРАВКИ */}
        {activeTab === 'courier' && (
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
        )}

      </main>

      {/* КАСТОМНОЕ МОДАЛЬНОЕ ОКНО СООБЩЕНИЙ */}
      {modalAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center space-y-4 animate-scale-up ${
            isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              modalAlert.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {modalAlert.type === 'success' ? <Check size={24} /> : <AlertTriangle size={24} />}
            </div>

            <div>
              <h3 className="text-sm font-bold">{modalAlert.title}</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {modalAlert.message}
              </p>
            </div>

            <button 
              onClick={() => setModalAlert(null)}
              className="w-full bg-[#58111A] text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ПРОФИЛЯ И КУРЬЕРОВ */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 relative animate-scale-up ${
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

      {/* МОДАЛЬНОЕ ОКНО ЗАКУПОЧНОЙ ПАРТИИ */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 shadow-2xl space-y-5 ${
            isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
          }`}>

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Новая закупочная партия</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Добавьте модели и укажите расходы по каждой из них
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-gray-400 text-xl px-2"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePurchaseBatch} className="space-y-5">

              {batchItems.map((item, itemIndex) => {
                const selectedProduct = products.find(
                  p => String(p.id) === String(item.productId)
                );

                const variantsTotal = item.variants.reduce(
                  (sum, variant) => sum + (Number(variant.quantity) || 0),
                  0
                );

                const availableProducts = products.filter(p =>
                  !batchItems.some((other, otherIndex) =>
                    otherIndex !== itemIndex &&
                    String(other.productId) === String(p.id)
                  )
                );

                return (
                  <div
                    key={itemIndex}
                    className={`rounded-2xl border p-4 space-y-4 ${
                      isDarkMode ? 'border-gray-700 bg-[#252525]' : 'border-rose-100 bg-rose-50/30'
                    }`}
                  >

                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm">
                        Модель №{itemIndex + 1}
                      </h3>

                      {batchItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBatchModel(itemIndex)}
                          className="text-red-500 text-xs font-semibold"
                        >
                          Удалить модель
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1.5">
                        Выберите модель из каталога
                      </label>

                      <select
                        required
                        value={item.productId}
                        onChange={e =>
                          updateBatchItem(itemIndex, 'productId', e.target.value)
                        }
                        className={batchInputClass}
                      >
                        <option value="">Выберите модель</option>

                        {availableProducts.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.title}
                          </option>
                        ))}
                      </select>

                      {products.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Сначала добавьте модель в каталог.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1.5">
                        Общее количество единиц
                      </label>

                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={e =>
                          updateBatchItem(itemIndex, 'quantity', e.target.value)
                        }
                        className={batchInputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <div>
                        <label className="text-xs font-semibold block mb-1.5">
                          Общая закупочная стоимость
                        </label>

                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Например, 500"
                          value={item.wholesaleAmount}
                          onChange={e =>
                            updateBatchItem(itemIndex, 'wholesaleAmount', e.target.value)
                          }
                          className={batchInputClass}
                        />

                        <select
                          value={item.wholesaleCurrency}
                          onChange={e =>
                            updateBatchItem(itemIndex, 'wholesaleCurrency', e.target.value)
                          }
                          className={`${batchInputClass} mt-2`}
                        >
                          <option value="CNY">CNY — Юань</option>
                          <option value="USD">USD — Доллар</option>
                          <option value="TJS">TJS — Сомони</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold block mb-1.5">
                          Общее карго этой модели
                        </label>

                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Например, 20"
                          value={item.cargoAmount}
                          onChange={e =>
                            updateBatchItem(itemIndex, 'cargoAmount', e.target.value)
                          }
                          className={batchInputClass}
                        />

                        <select
                          value={item.cargoCurrency}
                          onChange={e =>
                            updateBatchItem(itemIndex, 'cargoCurrency', e.target.value)
                          }
                          className={`${batchInputClass} mt-2`}
                        >
                          <option value="USD">USD — Доллар</option>
                          <option value="CNY">CNY — Юань</option>
                          <option value="TJS">TJS — Сомони</option>
                        </select>
                      </div>

                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1.5">
                        Цена продажи за одну единицу (TJS)
                      </label>

                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Например, 150"
                        value={item.salePriceTjs}
                        onChange={e =>
                          updateBatchItem(itemIndex, 'salePriceTjs', e.target.value)
                        }
                        className={batchInputClass}
                      />
                    </div>

                    <div className={`rounded-xl p-3 ${
                      isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white'
                    }`}>
                      <p className="text-xs text-gray-400">
                        Предварительная себестоимость одной единицы
                      </p>

                      <p className="text-xl font-bold text-[#8B2635] mt-1">
                        {calculateBatchItemCost(item).toFixed(2)} TJS
                      </p>

                      <p className="text-[10px] text-gray-400 mt-1">
                        Расчёт по текущим курсам. Итоговую стоимость фиксирует сервер.
                      </p>
                    </div>

                    <div className="border-t border-gray-500/20 pt-4 space-y-3">

                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm">
                          Цвета и размеры
                        </h4>

                        <span className={`text-xs ${
                          variantsTotal === Number(item.quantity)
                            ? 'text-green-500'
                            : 'text-orange-500'
                        }`}>
                          {variantsTotal} / {item.quantity || 0} шт.
                        </span>
                      </div>

                      {item.variants.map((variant, variantIndex) => (
                        <div
                          key={variantIndex}
                          className={`rounded-xl p-3 space-y-2 ${
                            isDarkMode ? 'bg-[#303030]' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold">
                              Вариант №{variantIndex + 1}
                            </span>

                            {item.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeBatchVariant(itemIndex, variantIndex)
                                }
                                className="text-red-500 text-xs"
                              >
                                Удалить
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                            <input
                              required
                              type="text"
                              placeholder="Цвет"
                              value={variant.color}
                              onChange={e =>
                                updateBatchVariant(
                                  itemIndex,
                                  variantIndex,
                                  'color',
                                  e.target.value
                                )
                              }
                              className={batchInputClass}
                            />

                            <input
                              required
                              type="text"
                              placeholder="Размер"
                              value={variant.size}
                              onChange={e =>
                                updateBatchVariant(
                                  itemIndex,
                                  variantIndex,
                                  'size',
                                  e.target.value
                                )
                              }
                              className={batchInputClass}
                            />

                            <input
                              required
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Количество"
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
                        className="w-full border border-dashed border-[#8B2635] text-[#8B2635] py-2.5 rounded-xl text-xs font-bold"
                      >
                        + Добавить цвет или размер
                      </button>

                      {variantsTotal !== Number(item.quantity) && (
                        <p className="text-xs text-orange-500">
                          Сумма количеств всех вариантов должна совпадать с общим количеством модели.
                        </p>
                      )}

                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addBatchModel}
                className="w-full border border-dashed border-[#8B2635] text-[#8B2635] py-3 rounded-xl text-xs font-bold"
              >
                + Добавить ещё одну модель в партию
              </button>

              <div>
                <label className="text-xs font-semibold block mb-1.5">
                  Примечание к партии (необязательно)
                </label>

                <textarea
                  value={batchNotes}
                  onChange={e => setBatchNotes(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Например: закупка у поставщика..."
                  className={batchInputClass}
                />
              </div>

              <button
                type="submit"
                disabled={batchSaving || batchItems.length === 0}
                className="w-full bg-[#58111A] text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {batchSaving ? 'Сохранение партии...' : 'Сохранить закупочную партию'}
              </button>

              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                disabled={batchSaving}
                className="w-full py-2 text-xs text-gray-400 font-semibold"
              >
                Отмена
              </button>

            </form>
          </div>
        </div>
      )}
      
      {/* МОДАЛЬНОЕ ОКНО УДАЛЕНИЯ */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center space-y-4 animate-scale-up ${
            isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-sm font-bold">Подтверждение удаления</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Вы точно хотите удалить <br />
                <span className="font-bold text-rose-400">«{productToDelete.title}»</span>?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => setProductToDelete(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  isDarkMode ? 'bg-[#2A2A2A] text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteProduct}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-colors active:scale-95"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО КАРТОЧКИ ТОВАРА */}
      {selectedProductDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 relative animate-scale-up ${
            isDarkMode ? 'bg-[#1E1E1E] text-white' : 'bg-white text-gray-900'
          }`}>
            <button 
              onClick={() => setSelectedProductDetails(null)}
              className={`absolute top-3 right-3 p-1.5 rounded-full ${
                isDarkMode ? 'bg-[#2A2A2A] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-black'
              }`}
            >
              <X size={18} />
            </button>

            <div className="w-full h-56 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <img 
                src={selectedProductDetails.photo} 
                alt={selectedProductDetails.title} 
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[10px] bg-rose-50 text-[#58111A] border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                Карточка товара
              </span>
              <h3 className="text-base font-bold mt-1">
                {selectedProductDetails.title}
              </h3>
            </div>

            <div className={`rounded-2xl p-3.5 space-y-2 border text-xs ${
              isDarkMode ? 'bg-[#252525] border-gray-800' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex justify-between">
                <span className="text-gray-400">Партия / Объем:</span>
                <span className="font-bold">{selectedProductDetails.quantity} шт</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Закупка оптом:</span>
                <span className="font-bold">{formatCurrencyValue(selectedProductDetails.totalWholesale, selectedProductDetails.wholesaleCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Доставка Карго:</span>
                <span className="font-bold">{formatCurrencyValue(selectedProductDetails.cargoCost, selectedProductDetails.cargoCurrency)}</span>
              </div>
              <div className={`border-t pt-2 flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <span className="font-bold text-gray-400">Себестоимость 1 шт:</span>
                <span className="font-bold text-sm text-rose-500">
                  {calcSingleItemTJS(selectedProductDetails)} TJS
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedProductDetails(null)}
              className="w-full bg-[#58111A] text-white py-2.5 rounded-xl text-xs font-semibold"
            >
              Закрыть
            </button>

          </div>
        </div>
      )}

          {isQuickAddMenuOpen && (
      <>
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setIsQuickAddMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30"
        />
    
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[min(340px,calc(100vw-32px))] rounded-2xl p-3 shadow-2xl border ${
          isDarkMode
            ? 'bg-[#1E1E1E] border-gray-700 text-white'
            : 'bg-white border-rose-100 text-gray-900'
        }`}>
          <p className="text-xs font-bold text-gray-400 px-2 pb-2">
            ЧТО ДОБАВИТЬ?
          </p>
    
          <button
            type="button"
            onClick={() => {
              setIsQuickAddMenuOpen(false);
              setEditingId(null);
              setProdTitle('');
              setProdQty('6');
              setProdWholesale('');
              setProdCargoCost('');
              setSelectedImageFile(null);
              setCurrentPhotoPreview(null);
              setIsAddModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-rose-50"
          >
            <span className="w-10 h-10 rounded-xl bg-rose-100 text-[#58111A] flex items-center justify-center">
              <PlusCircle size={20} />
            </span>
    
            <span>
              <span className="block text-sm font-bold">Добавить товар</span>
              <span className="block text-xs text-gray-400">
                Создать новую модель в каталоге
              </span>
            </span>
          </button>
    
          <button
            type="button"
            onClick={() => {
              setIsQuickAddMenuOpen(false);
              setBatchItems([createEmptyBatchItem()]);
              setBatchNotes('');
              setBatchName(`Поставка от ${new Date().toLocaleDateString('ru-RU')}`);
              setBatchNewProductTitle('');
              setBatchStep(1);
              setShowBatchVariants(false);
              setIsBatchModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-rose-50"
          >
            <span className="w-10 h-10 rounded-xl bg-rose-100 text-[#58111A] flex items-center justify-center">
              <Truck size={20} />
            </span>
    
            <span>
              <span className="block text-sm font-bold">Новая поставка</span>
              <span className="block text-xs text-gray-400">
                Принять товары на склад
              </span>
            </span>
          </button>
        </div>
      </>
    )}

      {/* Нижняя навигация */}
      <nav className={`flex justify-around items-center border-t h-16 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 shadow-lg px-2 transition-colors ${
        isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-white border-rose-100'
      }`}>
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'home' ? 'text-rose-400 font-bold' : 'text-gray-400'}`}
        >
          <Home size={18} />
          <span className="text-[10px] mt-1">Главная</span>
        </button>

        <button 
          onClick={() => setActiveTab('products')} 
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'products' ? 'text-rose-400 font-bold' : 'text-gray-400'}`}
        >
          <ShoppingBag size={18} />
          <span className="text-[10px] mt-1">Товары</span>
        </button>

        {/* ЦЕНТРАЛЬНАЯ КНОПКА + */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={() => setIsQuickAddMenuOpen(prev => !prev)}
            className={`w-12 h-12 rounded-full bg-[#58111A] text-white flex items-center justify-center shadow-lg border-4 active:scale-95 transition-transform ${
              isDarkMode ? 'border-[#121212]' : 'border-[#FAF8F5]'
            }`}
          >
            {isQuickAddMenuOpen ? <X size={22} /> : <Plus size={22} />}
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('calc')} 
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'calc' ? 'text-rose-400 font-bold' : 'text-gray-400'}`}
        >
          <Calculator size={18} />
          <span className="text-[10px] mt-1">Расчет</span>
        </button>

        <button 
          onClick={() => setActiveTab('courier')} 
          className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'courier' ? 'text-rose-400 font-bold' : 'text-gray-400'}`}
        >
          <Truck size={18} />
          <span className="text-[10px] mt-1">Курьер</span>
        </button>
      </nav>

    </div>
  );
}
