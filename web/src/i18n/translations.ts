export type Language = 'uz' | 'ru' | 'uz_cyrl';

export interface Translations {
  // Navigation
  nav_dashboard: string;
  nav_orders: string;
  nav_agents: string;
  nav_products: string;
  nav_shops: string;
  nav_reports: string;
  nav_section: string;
  system_status: string;
  server_active: string;
  version: string;

  // Header
  today_sales: string;
  active_agents: string;
  admin_role: string;
  office_name: string;

  // Dashboard
  dash_title: string;
  dash_sub: string;
  kpi_total_sales: string;
  kpi_orders_count: string;
  kpi_cash: string;
  kpi_debt: string;
  orders_unit: string;
  som: string;
  vs_yesterday: string;
  all_reviewed: string;
  new_pending: string;
  cash_desc: string;
  shops_with_debt: string;
  recent_orders: string;
  recent_orders_sub: string;
  view_all: string;
  top_agents: string;
  top_agents_sub: string;
  quick_add_agent: string;
  quick_warehouse: string;

  // Orders
  orders_title: string;
  orders_sub: string;
  search_orders_placeholder: string;
  tab_all: string;
  tab_new: string;
  tab_confirmed: string;
  tab_delivered: string;
  tab_cancelled: string;
  col_order_id: string;
  col_date: string;
  col_client: string;
  col_agent: string;
  col_payment_type: string;
  col_sum: string;
  col_status: string;
  col_actions: string;
  btn_view_invoice: string;
  total_orders_count: string;
  displayed_sum: string;

  // Statuses & Payment
  status_new: string;
  status_confirmed: string;
  status_delivered: string;
  status_cancelled: string;
  pay_cash: string;
  pay_debt: string;
  pay_bank: string;

  // Agents & QR
  agents_title: string;
  agents_sub: string;
  btn_add_agent: string;
  btn_print_qr: string;
  agent_code: string;
  agent_orders: string;
  agent_sales: string;
  modal_add_agent_title: string;
  modal_add_agent_sub: string;
  field_agent_name: string;
  field_agent_phone: string;
  field_agent_territory: string;
  btn_cancel: string;
  btn_save_qr: string;
  agent_status_active: string;
  mln: string;

  // QR Badge Modal
  badge_modal_title: string;
  badge_brand: string;
  badge_sub: string;
  badge_footer: string;
  btn_print: string;
  btn_close: string;

  // Products
  products_title: string;
  products_sub: string;
  search_products_placeholder: string;
  all_categories: string;
  btn_add_product: string;
  col_code: string;
  col_product_name: string;
  col_category: string;
  col_price_dona: string;
  col_price_blok: string;
  col_price_box: string;
  col_price_kg: string;
  col_stock: string;
  modal_add_product_title: string;
  modal_add_product_sub: string;
  btn_save_product: string;
  stock_unit: string;
  initial_stock_label: string;

  // Shops
  shops_title: string;
  shops_sub: string;
  search_shops_placeholder: string;
  filter_debt_only: string;
  total_debt_ledger: string;
  btn_add_shop: string;
  col_shop_name: string;
  col_owner: string;
  col_phone: string;
  col_address: string;
  col_route_day: string;
  col_debt: string;
  no_debt: string;
  btn_accept_payment: string;
  modal_payment_title: string;
  current_debt: string;
  payment_amount: string;
  btn_save_payment: string;
  modal_add_shop_title: string;
  btn_save_shop: string;

  // Reports
  reports_title: string;
  reports_sub: string;
  rev_structure: string;
  rev_total: string;
  rev_cash: string;
  rev_debt: string;
  rev_bank: string;
  share: string;
  agent_performance: string;
  col_avg_check: string;
  product_turnover: string;
  warehouse_stock: string;
  sales_volume_100: string;

  // Invoice Modal
  invoice_title: string;
  invoice_sub: string;
  invoice_buyer: string;
  invoice_agent: string;
  invoice_col_no: string;
  invoice_col_name: string;
  invoice_col_unit: string;
  invoice_col_qty: string;
  invoice_col_price: string;
  invoice_col_total: string;
  invoice_notes: string;
  invoice_subtotal: string;
  invoice_discount: string;
  invoice_total_pay: string;
  invoice_released_by: string;
  invoice_received_by: string;
  invoice_sign_agent: string;
  invoice_sign_client: string;
  btn_print_a4: string;

  // Days of week
  day_mon: string;
  day_tue: string;
  day_wed: string;
  day_thu: string;
  day_fri: string;
  day_sat: string;
}

export const translations: Record<Language, Translations> = {
  uz: {
    // Navigation
    nav_dashboard: 'Bosh Panel',
    nav_orders: 'Buyurtmalar',
    nav_agents: 'Agentlar & QR',
    nav_products: 'Tovarlar & Ombor',
    nav_shops: 'Doʻkonlar & Qarz',
    nav_reports: 'Hisobotlar',
    nav_section: 'Asosiy Boʻlimlar',
    system_status: 'Server holati:',
    server_active: 'Faol (NestJS)',
    version: 'Versiya 1.0.0 (Mobi_R Web)',

    // Header
    today_sales: 'Bugungi savdo:',
    active_agents: 'Agentlar:',
    admin_role: 'Bosh Administrator',
    office_name: 'Mobi_R Ofisi',

    // Dashboard
    dash_title: 'Bosh Boshqaruv Paneli',
    dash_sub: 'Mobi_R savdo agentlari va buyurtmalar monitoringi',
    kpi_total_sales: 'Bugungi Jami Savdo',
    kpi_orders_count: 'Buyurtmalar Soni',
    kpi_cash: 'Naqd Pul Tushumi',
    kpi_debt: 'Mijozlar Qarzdorligi',
    orders_unit: 'ta zakaz',
    som: "so'm",
    vs_yesterday: '+14.2% kechagiga nisbatan',
    all_reviewed: 'Barcha zakazlar koʻrib chiqilgan',
    new_pending: 'ta yangi kutmoqda',
    cash_desc: 'Agentlar kassasidagi naqd pul',
    shops_with_debt: 'ta doʻkonda qarz bor',
    recent_orders: 'Soʻnggi Buyurtmalar (Live)',
    recent_orders_sub: 'Agentlar yuborgan eng yangi zakazlar',
    view_all: 'Barchasini koʻrish',
    top_agents: 'Top Savdo Agentlari',
    top_agents_sub: 'Bugungi savdo koʻrsatkichi',
    quick_add_agent: '+ Agent & QR Beydjik',
    quick_warehouse: 'Ombor & Tovarlar',

    // Orders
    orders_title: 'Buyurtmalar Jurnali',
    orders_sub: 'Agentlar qabul qilgan buyurtmalar va yuk xatlari',
    search_orders_placeholder: 'Buyurtma ID, doʻkon yoki agent...',
    tab_all: 'Barchasi',
    tab_new: 'Yangi',
    tab_confirmed: 'Tasdiqlangan',
    tab_delivered: 'Yetkazilgan',
    tab_cancelled: 'Bekor qilingan',
    col_order_id: 'Buyurtma №',
    col_date: 'Sana va Vaqt',
    col_client: 'Doʻkon (Xaridor)',
    col_agent: 'Savdo Agenti',
    col_payment_type: 'Toʻlov turi',
    col_sum: 'Summa',
    col_status: 'Holati',
    col_actions: 'Amal',
    btn_view_invoice: 'Yuk xati',
    total_orders_count: 'Jami buyurtmalar:',
    displayed_sum: 'Koʻrsatilgan zakazlar summasi:',

    // Statuses & Payment
    status_new: 'Yangi',
    status_confirmed: 'Tasdiqlangan',
    status_delivered: 'Yetkazilgan',
    status_cancelled: 'Bekor qilingan',
    pay_cash: 'Naqd pul',
    pay_debt: 'Nasiya (Qarz)',
    pay_bank: 'Bank oʻtkazmasi',

    // Agents & QR
    agents_title: 'Savdo Agentlari Boshqaruvi',
    agents_sub: 'Agentlar roʻyxati va mobil ilovaga kirish uchun shaxsiy QR-beydjiklar',
    btn_add_agent: 'Yangi Agent Qoʻshish',
    btn_print_qr: 'QR-Beydjikni Chop Etish',
    agent_code: 'Kodi:',
    agent_orders: 'Zakazlar',
    agent_sales: 'Savdo',
    modal_add_agent_title: 'Yangi Savdo Agenti Qoʻshish',
    modal_add_agent_sub: 'Agent kiritilgach, unga avtomatik QR-kodli beydjik shakllanadi',
    field_agent_name: 'F.I.SH (Ism va Familiya) *',
    field_agent_phone: 'Telefon raqami *',
    field_agent_territory: 'Biriktirilgan hudud / Tuman *',
    btn_cancel: 'Bekor qilish',
    btn_save_qr: 'Saqlash & QR Yaratish',
    agent_status_active: 'Faol',
    mln: 'mln',

    // QR Badge Modal
    badge_modal_title: 'Agent Shaxsiy QR-Beydjiki',
    badge_brand: 'MOBI_R QANDOLAT',
    badge_sub: 'SAVDO AGENTI BEYDJIKI',
    badge_footer: 'Mobil ilovaga kirish uchun kameraga koʻrsating',
    btn_print: 'Printerdan Chiqarish',
    btn_close: 'Yopish',

    // Products
    products_title: 'Mahsulotlar Katalogi & Ombor',
    products_sub: 'Qandolat mahsulotlari, 4 xil qadoq narxlari va qoldiqlar',
    search_products_placeholder: 'Tovar nomi yoki kodi boʻyicha...',
    all_categories: 'Barcha toifalar',
    btn_add_product: 'Yangi Tovar Qoʻshish',
    col_code: 'Artikul',
    col_product_name: 'Mahsulot Nomi',
    col_category: 'Toifasi',
    col_price_dona: '1 Dona Narxi',
    col_price_blok: '1 Blok Narxi',
    col_price_box: '1 Quti (Korobka)',
    col_price_kg: '1 Kg Narxi',
    col_stock: 'Ombor Qoldigʻi',
    modal_add_product_title: 'Yangi Qandolat Tovari Qoʻshish',
    modal_add_product_sub: 'Tovar nomlari va 4 xil qadoq boʻyicha ulgurji narxlarni belgilang',
    btn_save_product: 'Tovarni Saqlash',
    stock_unit: 'dona',
    initial_stock_label: 'Ombordagi boshlangʻich qoldiq (dona hisobida)',

    // Shops
    shops_title: 'Mijozlar & Debitorlik Balansi',
    shops_sub: 'Doʻkonlar roʻyxati, qarzdorlik va toʻlovlar (PKO)',
    search_shops_placeholder: 'Doʻkon, egasi yoki manzil...',
    filter_debt_only: 'Faqat Qarzdorlar',
    total_debt_ledger: 'Umumiy Debitorlik',
    btn_add_shop: 'Yangi Doʻkon',
    col_shop_name: 'Doʻkon Nomi',
    col_owner: 'Masʼul / Egasi',
    col_phone: 'Telefon',
    col_address: 'Manzil',
    col_route_day: 'Marshrut Kuni',
    col_debt: 'Qarzdorlik Balansi',
    no_debt: 'Qarzi yoʻq',
    btn_accept_payment: 'Toʻlov Qabul Qilish',
    modal_payment_title: 'Qarz Toʻlovini Qabul Qilish (PKO)',
    current_debt: 'Hozirgi qarz:',
    payment_amount: 'Qabul qilingan summa (soʻm) *',
    btn_save_payment: 'Toʻlovni Qayd Etish',
    modal_add_shop_title: 'Yangi Doʻkon (Mijoz) Qoʻshish',
    btn_save_shop: 'Doʻkonni Saqlash',

    // Reports
    reports_title: 'Biznes Analitika & Hisobotlar',
    reports_sub: 'Daromadlar strukturasi, kassa va tovar aylanmasi',
    rev_structure: 'Tushumlar Strukturasi',
    rev_total: 'Jami Tushum',
    rev_cash: 'Naqd Tushum',
    rev_debt: 'Nasiyaga (Qarz)',
    rev_bank: 'Bank Oʻtkazmasi',
    share: 'ulush',
    agent_performance: 'Savdo Agentlari Samaradorligi',
    col_avg_check: 'Oʻrtacha Chek',
    product_turnover: 'Qandolat Tovarlari Qoldigʻi va Aylanmasi',
    warehouse_stock: 'ombor qoldigʻi',
    sales_volume_100: '100% savdo hajmi',

    // Invoice Modal
    invoice_title: 'YUK XATI / HISOB CHEKI',
    invoice_sub: 'Qandolat mahsulotlari distribyutsiyasi va ulgurji savdosi',
    invoice_buyer: 'Xaridor (Doʻkon):',
    invoice_agent: 'Yetkazuvchi savdo agenti:',
    invoice_col_no: '№',
    invoice_col_name: 'Mahsulot nomi',
    invoice_col_unit: 'Birligi',
    invoice_col_qty: 'Soni',
    invoice_col_price: 'Narxi',
    invoice_col_total: 'Jami summa',
    invoice_notes: 'Izoh:',
    invoice_subtotal: 'Tovarlar summasi:',
    invoice_discount: 'Chegirma:',
    invoice_total_pay: 'JAMI TOʻLOV:',
    invoice_released_by: 'Topshirdi (Agent / Haydovchi):',
    invoice_received_by: 'Qabul qildi (Doʻkon masʼuli):',
    invoice_sign_agent: '(imzo va F.I.SH)',
    invoice_sign_client: '(imzo va muhr)',
    btn_print_a4: 'Chop etish (A4)',

    // Days of week
    day_mon: 'Dushanba',
    day_tue: 'Seshanba',
    day_wed: 'Chorshanba',
    day_thu: 'Payshanba',
    day_fri: 'Juma',
    day_sat: 'Shanba',
  },

  ru: {
    // Navigation
    nav_dashboard: 'Главная панель',
    nav_orders: 'Заказы',
    nav_agents: 'Агенты & QR',
    nav_products: 'Товары & Склад',
    nav_shops: 'Клиенты & Долги',
    nav_reports: 'Отчеты',
    nav_section: 'Основные разделы',
    system_status: 'Статус сервера:',
    server_active: 'Активен (NestJS)',
    version: 'Версия 1.0.0 (Моби-С Web)',

    // Header
    today_sales: 'Продажи сегодня:',
    active_agents: 'Агенты:',
    admin_role: 'Главный Администратор',
    office_name: 'Офис Mobi_R',

    // Dashboard
    dash_title: 'Панель Управления Моби-С',
    dash_sub: 'Мониторинг торговых агентов и заказов в реальном времени',
    kpi_total_sales: 'Продажи за Сегодня',
    kpi_orders_count: 'Количество Заказов',
    kpi_cash: 'Поступления Наличными',
    kpi_debt: 'Дебиторская Задолженность',
    orders_unit: 'заявок',
    som: 'сум',
    vs_yesterday: '+14.2% по сравнению со вчера',
    all_reviewed: 'Все заявки обработаны',
    new_pending: 'новых ожидают',
    cash_desc: 'В кассе торговых агентов',
    shops_with_debt: 'точек имеют долг',
    recent_orders: 'Последние Заказы (Live)',
    recent_orders_sub: 'Свежие заявки от торговых представителей',
    view_all: 'Смотреть все',
    top_agents: 'Топ Торговых Агентов',
    top_agents_sub: 'Результаты продаж за день',
    quick_add_agent: '+ Агент & QR-Бейдж',
    quick_warehouse: 'Склад & Остатки',

    // Orders
    orders_title: 'Журнал Документов',
    orders_sub: 'Оформленные заявки, накладные и счета покупателей',
    search_orders_placeholder: 'Номер заказа, клиент или агент...',
    tab_all: 'Все',
    tab_new: 'Новые',
    tab_confirmed: 'Подтвержденные',
    tab_delivered: 'Доставленные',
    tab_cancelled: 'Отмененные',
    col_order_id: 'Заказ №',
    col_date: 'Дата и Время',
    col_client: 'Торговая точка (Клиент)',
    col_agent: 'Торговый Агент',
    col_payment_type: 'Тип оплаты',
    col_sum: 'Сумма',
    col_status: 'Статус',
    col_actions: 'Действие',
    btn_view_invoice: 'Накладная',
    total_orders_count: 'Всего заказов:',
    displayed_sum: 'Сумма отображаемых заказов:',

    // Statuses & Payment
    status_new: 'Новый',
    status_confirmed: 'Подтвержден',
    status_delivered: 'Доставлен',
    status_cancelled: 'Отменен',
    pay_cash: 'Наличные',
    pay_debt: 'Отсрочка (Долг)',
    pay_bank: 'Безналичный расчет',

    // Agents & QR
    agents_title: 'Управление Торговыми Агентами',
    agents_sub: 'Список агентов и персональные QR-бейджы для входа в приложение',
    btn_add_agent: 'Добавить Агента',
    btn_print_qr: 'Печать QR-Бейджа',
    agent_code: 'Код:',
    agent_orders: 'Заказов',
    agent_sales: 'Продажи',
    modal_add_agent_title: 'Добавление Торгового Представителя',
    modal_add_agent_sub: 'После создания формируется персональный бейдж с QR-кодом',
    field_agent_name: 'Ф.И.О. Агента *',
    field_agent_phone: 'Номер телефона *',
    field_agent_territory: 'Закрепленный сектор / Район *',
    btn_cancel: 'Отмена',
    btn_save_qr: 'Сохранить и Создать QR',
    agent_status_active: 'Активен',
    mln: 'млн',

    // QR Badge Modal
    badge_modal_title: 'Персональный QR-Бейдж Агента',
    badge_brand: 'МОБИ-С КОНДИТЕР',
    badge_sub: 'БЕЙДЖ ТОРГОВОГО АГЕНТА',
    badge_footer: 'Наведите камеру мобильного устройства для входа',
    btn_print: 'Распечатать на принтере',
    btn_close: 'Закрыть',

    // Products
    products_title: 'Каталог Товаров & Склад',
    products_sub: 'Кондитерские изделия, цены за 4 типа упаковки и остатки',
    search_products_placeholder: 'Поиск по наименованию, артикулу...',
    all_categories: 'Все категории',
    btn_add_product: 'Новый Товар',
    col_code: 'Артикул',
    col_product_name: 'Наименование Товара',
    col_category: 'Категория',
    col_price_dona: 'Цена за Шт',
    col_price_blok: 'Цена за Блок',
    col_price_box: 'Цена за Коробку',
    col_price_kg: 'Цена за Кг',
    col_stock: 'Остаток на Складе',
    modal_add_product_title: 'Добавление Нового Товара',
    modal_add_product_sub: 'Укажите цены для розничных и оптовых упаковок',
    btn_save_product: 'Сохранить Товар',
    stock_unit: 'шт',
    initial_stock_label: 'Начальный остаток на складе (в шт)',

    // Shops
    shops_title: 'Клиенты & Дебиторская Задолженность',
    shops_sub: 'База торговых точек, адреса, долги и фиксация оплат (ПКО)',
    search_shops_placeholder: 'Название магазина, адрес, ответственный...',
    filter_debt_only: 'Только Должники',
    total_debt_ledger: 'Общий Долг Клиентов',
    btn_add_shop: 'Новая Точка',
    col_shop_name: 'Торговая Точка',
    col_owner: 'Ответственное Лицо',
    col_phone: 'Телефон',
    col_address: 'Адрес',
    col_route_day: 'День Маршрута',
    col_debt: 'Баланс Долга',
    no_debt: 'Нет долга',
    btn_accept_payment: 'Прием Оплаты',
    modal_payment_title: 'Приходный Кассовый Ордер (ПКО)',
    current_debt: 'Текущий долг:',
    payment_amount: 'Сумма оплаты (сум) *',
    btn_save_payment: 'Провести Оплату',
    modal_add_shop_title: 'Регистрация Торговой Точки',
    btn_save_shop: 'Сохранить Точку',

    // Reports
    reports_title: 'Бизнес Аналитика & Отчеты',
    reports_sub: 'Структура выручки, касса и оборачиваемость продукции',
    rev_structure: 'Структура Выручки',
    rev_total: 'Общая Выручка',
    rev_cash: 'Наличный Расчет',
    rev_debt: 'В Долг (Отсрочка)',
    rev_bank: 'Безналичный Расчет',
    share: 'доля',
    agent_performance: 'Эффективность Торговых Представителей',
    col_avg_check: 'Средний Чек',
    product_turnover: 'Остатки и Оборачиваемость Сладостей',
    warehouse_stock: 'остаток на складе',
    sales_volume_100: '100% объем продаж',

    // Invoice Modal
    invoice_title: 'ТОВАРНАЯ НАКЛАДНАЯ / СЧЕТ',
    invoice_sub: 'Дистрибьюция и оптовая торговля кондитерскими изделиями',
    invoice_buyer: 'Покупатель (Торговая точка):',
    invoice_agent: 'Торговый представитель / Экспедитор:',
    invoice_col_no: '№',
    invoice_col_name: 'Наименование товара',
    invoice_col_unit: 'Ед. изм.',
    invoice_col_qty: 'Кол-во',
    invoice_col_price: 'Цена',
    invoice_col_total: 'Сумма',
    invoice_notes: 'Примечание:',
    invoice_subtotal: 'Сумма товаров:',
    invoice_discount: 'Скидка:',
    invoice_total_pay: 'ИТОГО К ОПЛАТЕ:',
    invoice_released_by: 'Отпустил (Агент / Экспедитор):',
    invoice_received_by: 'Принял (Ответственный точки):',
    invoice_sign_agent: '(подпись и Ф.И.О)',
    invoice_sign_client: '(подпись и печать)',
    btn_print_a4: 'Печать (A4)',

    // Days of week
    day_mon: 'Понедельник',
    day_tue: 'Вторник',
    day_wed: 'Среда',
    day_thu: 'Четверг',
    day_fri: 'Пятница',
    day_sat: 'Суббота',
  },

  uz_cyrl: {
    // Navigation
    nav_dashboard: 'Бош Панел',
    nav_orders: 'Буюртмалар',
    nav_agents: 'Агентлар & QR',
    nav_products: 'Товарлар & Омбор',
    nav_shops: 'Дўконлар & Қарз',
    nav_reports: 'Ҳисоботлар',
    nav_section: 'Асосий Бўлимлар',
    system_status: 'Сервер ҳолати:',
    server_active: 'Фаол (NestJS)',
    version: 'Версия 1.0.0 (Mobi_R Web)',

    // Header
    today_sales: 'Бугунги савдо:',
    active_agents: 'Агентлар:',
    admin_role: 'Бош Администратор',
    office_name: 'Mobi_R Офиси',

    // Dashboard
    dash_title: 'Бош Бошқарув Панели',
    dash_sub: 'Mobi_R савдо агентлари ва буюртмалар мониторинги',
    kpi_total_sales: 'Бугунги Жами Савдо',
    kpi_orders_count: 'Буюртмалар Сони',
    kpi_cash: 'Нақд Пул Тушуми',
    kpi_debt: 'Мижозлар Қарздорлиги',
    orders_unit: 'та заказ',
    som: 'сўм',
    vs_yesterday: '+14.2% кечагига нисбатан',
    all_reviewed: 'Барча заказлар кўриб чиқилган',
    new_pending: 'та янги кутмоқда',
    cash_desc: 'Агентлар кассасидаги нақд пул',
    shops_with_debt: 'та дўконда қарз бор',
    recent_orders: 'Сўнгги Буюртмалар (Live)',
    recent_orders_sub: 'Агентлар юборган энг янги заказлар',
    view_all: 'Барчасини кўриш',
    top_agents: 'Топ Савдо Агентлари',
    top_agents_sub: 'Бугунги савдо кўрсаткичи',
    quick_add_agent: '+ Агент & QR Бейджик',
    quick_warehouse: 'Омбор & Товарлар',

    // Orders
    orders_title: 'Буюртмалар Журнали',
    orders_sub: 'Агентлар қабул қилган буюртмалар ва юк хатлари',
    search_orders_placeholder: 'Буюртма ID, дўкон ёки агент...',
    tab_all: 'Барчаси',
    tab_new: 'Янги',
    tab_confirmed: 'Тасдиқланган',
    tab_delivered: 'Етказилган',
    tab_cancelled: 'Бекор қилинган',
    col_order_id: 'Буюртма №',
    col_date: 'Сана ва Вақт',
    col_client: 'Дўкон (Харидор)',
    col_agent: 'Савдо Агенти',
    col_payment_type: 'Тўлов тури',
    col_sum: 'Сумма',
    col_status: 'Ҳолати',
    col_actions: 'Амал',
    btn_view_invoice: 'Юк хати',
    total_orders_count: 'Жами буюртмалар:',
    displayed_sum: 'Кўрсатилган заказлар суммаси:',

    // Statuses & Payment
    status_new: 'Янги',
    status_confirmed: 'Тасдиқланган',
    status_delivered: 'Етказилган',
    status_cancelled: 'Бекор қилинган',
    pay_cash: 'Нақд пул',
    pay_debt: 'Насия (Қарз)',
    pay_bank: 'Банк ўтказмаси',

    // Agents & QR
    agents_title: 'Савдо Агентлари Бошқаруви',
    agents_sub: 'Агентлар рўйхати ва мобил иловага кириш учун шахсий QR-бейжиклар',
    btn_add_agent: 'Янги Агент Қўшиш',
    btn_print_qr: 'QR-Бейжикни Чоп Этиш',
    agent_code: 'Коди:',
    agent_orders: 'Заказлар',
    agent_sales: 'Савдо',
    modal_add_agent_title: 'Янги Савдо Агенти Қўшиш',
    modal_add_agent_sub: 'Агент киритилгач, унга автоматик QR-кодли бейжик шаклланади',
    field_agent_name: 'Ф.И.Ш (Исм ва Фамилия) *',
    field_agent_phone: 'Телефон рақами *',
    field_agent_territory: 'Бириктирилган ҳудуд / Туман *',
    btn_cancel: 'Бекор қилиш',
    btn_save_qr: 'Сақлаш & QR Яратиш',
    agent_status_active: 'Фаол',
    mln: 'млн',

    // QR Badge Modal
    badge_modal_title: 'Агент Шахсий QR-Бейжики',
    badge_brand: 'MOBI_R ҚАНДОЛАТ',
    badge_sub: 'САВДО АГЕНТИ БЕЙЖИКИ',
    badge_footer: 'Мобил иловага кириш учун камерага кўрсатинг',
    btn_print: 'Принтердан Чиқариш',
    btn_close: 'Ёпиш',

    // Products
    products_title: 'Маҳсулотлар Каталоги & Омбор',
    products_sub: 'Қандолат маҳсулотлари, 4 хил қадоқ нархлари ва қолдиқлар',
    search_products_placeholder: 'Товар номи ёки коди бўйича...',
    all_categories: 'Барча тоифалар',
    btn_add_product: 'Янги Товар Қўшиш',
    col_code: 'Артикул',
    col_product_name: 'Маҳсулот Номи',
    col_category: 'Тоифаси',
    col_price_dona: '1 Дона Нархи',
    col_price_blok: '1 Блок Нархи',
    col_price_box: '1 Қути (Коробка)',
    col_price_kg: '1 Кг Нархи',
    col_stock: 'Омбор Қолдиғи',
    modal_add_product_title: 'Янги Қандолат Товари Қўшиш',
    modal_add_product_sub: 'Товар номлари ва 4 хил қадоқ бўйича улгуржи нархларни белгиланг',
    btn_save_product: 'Товарни Сақлаш',
    stock_unit: 'дона',
    initial_stock_label: 'Омбордаги бошланғич қолдиқ (дона ҳисобида)',

    // Shops
    shops_title: 'Мижозлар & Дебиторлик Баланси',
    shops_sub: 'Дўконлар рўйхати, қарздорлик ва тўловлар (ПКО)',
    search_shops_placeholder: 'Дўкон, эгаси ёки манзил...',
    filter_debt_only: 'Фақат Қарздорлар',
    total_debt_ledger: 'Умумий Дебиторлик',
    btn_add_shop: 'Янги Дўкон',
    col_shop_name: 'Дўкон Номи',
    col_owner: 'Масъул / Эгаси',
    col_phone: 'Телефон',
    col_address: 'Манзил',
    col_route_day: 'Маршрут Куни',
    col_debt: 'Қарздорлик Баланси',
    no_debt: 'Қарзи йўқ',
    btn_accept_payment: 'Тўлов Қабул Қилиш',
    modal_payment_title: 'Қарз Тўловини Қабул Қилиш (ПКО)',
    current_debt: 'Ҳозирги қарз:',
    payment_amount: 'Қабул қилинган сумма (сўм) *',
    btn_save_payment: 'Тўловни Қайд Этиш',
    modal_add_shop_title: 'Янги Дўкон (Мижоз) Қўшиш',
    btn_save_shop: 'Дўконни Сақлаш',

    // Reports
    reports_title: 'Бизнес Аналитика & Ҳисоботлар',
    reports_sub: 'Даромадлар структураси, касса ва товар айланмаси',
    rev_structure: 'Тушумлар Структураси',
    rev_total: 'Жами Тушум',
    rev_cash: 'Нақд Тушум',
    rev_debt: 'Насияга (Қарз)',
    rev_bank: 'Банк Ўтказмаси',
    share: 'улуш',
    agent_performance: 'Савдо Агентлари Самарадорлиги',
    col_avg_check: 'Ўртача Чек',
    product_turnover: 'Қандолат Товарлари Қолдиғи ва Айланмаси',
    warehouse_stock: 'омбор қолдиғи',
    sales_volume_100: '100% савдо ҳажми',

    // Invoice Modal
    invoice_title: 'ЮК ХАТИ / ҲИСОБ ЧЕКИ',
    invoice_sub: 'Қандолат маҳсулотлари дистрибьюцияси ва улгуржи савдоси',
    invoice_buyer: 'Харидор (Дўкон):',
    invoice_agent: 'Етказувчи савдо агенти:',
    invoice_col_no: '№',
    invoice_col_name: 'Маҳсулот номи',
    invoice_col_unit: 'Бирлиги',
    invoice_col_qty: 'Сони',
    invoice_col_price: 'Нархи',
    invoice_col_total: 'Жами сумма',
    invoice_notes: 'Изоҳ:',
    invoice_subtotal: 'Товарлар суммаси:',
    invoice_discount: 'Чегирма:',
    invoice_total_pay: 'ЖАМИ ТЎЛОВ:',
    invoice_released_by: 'Топширди (Агент / Ҳайдовчи):',
    invoice_received_by: 'Қабул қилди (Дўкон масъули):',
    invoice_sign_agent: '(имзо ва Ф.И.Ш)',
    invoice_sign_client: '(имзо ва муҳр)',
    btn_print_a4: 'Чоп этиш (A4)',

    // Days of week
    day_mon: 'Душанба',
    day_tue: 'Сешанба',
    day_wed: 'Чоршанба',
    day_thu: 'Пайшанба',
    day_fri: 'Жума',
    day_sat: 'Шанба',
  },
};
