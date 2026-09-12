export type MobileLanguage = 'uz' | 'ru' | 'uz_cyrl';

export interface MobileTranslations {
  // General & Common
  currency: string;
  pcs: string;
  block: string;
  box: string;
  kg: string;
  cancel: string;
  save: string;
  confirm: string;
  search: string;
  loading: string;
  close: string;
  success: string;
  error: string;
  warning: string;
  items_count: string;

  // Navigation Tabs & Stacks
  tab_home: string;
  tab_shops: string;
  tab_catalog: string;
  tab_history: string;
  tab_reports: string;
  nav_shop_detail: string;
  nav_new_shop: string;
  nav_cart: string;
  nav_checkout: string;
  nav_profile: string;
  nav_reports_agent: string;
  nav_orders_journal: string;

  // Auth Screen
  auth_brand: string;
  auth_subtitle: string;
  auth_scan_hint: string;
  auth_camera_permission: string;
  auth_grant_camera: string;
  auth_manual_title: string;
  auth_enter_code: string;
  auth_code_placeholder: string;
  auth_login_btn: string;
  auth_error_title: string;
  auth_retry: string;
  auth_enter_code_alert: string;

  // Home Screen
  home_brand: string;
  home_to_export: string;
  home_base_actual: string;
  home_sales_today: string;
  home_orders_count: string;
  home_cash_today: string;
  home_route_plan: string;
  home_visited: string;
  home_of: string;
  home_menu_route: string;
  home_menu_order: string;
  home_menu_docs: string;
  home_menu_sync: string;
  home_menu_reports: string;
  home_menu_settings: string;
  home_sync_title: string;
  home_sync_success: string;
  home_sync_failed: string;

  // Catalog & Ordering Screen
  catalog_search_placeholder: string;
  catalog_all: string;
  catalog_cart_total: string;
  catalog_order_btn: string;
  catalog_in_stock: string;
  catalog_price_dona: string;
  catalog_price_blok: string;
  catalog_price_box: string;
  catalog_price_kg: string;
  catalog_added: string;

  // Cart & Checkout
  cart_title: string;
  cart_empty: string;
  cart_empty_sub: string;
  cart_clear: string;
  cart_proceed: string;
  checkout_client: string;
  checkout_pay_method: string;
  checkout_pay_cash: string;
  checkout_pay_debt: string;
  checkout_pay_bank: string;
  checkout_discount: string;
  checkout_notes: string;
  checkout_total_before: string;
  checkout_total_final: string;
  checkout_confirm_btn: string;
  checkout_confirm_title: string;
  checkout_confirm_msg: string;
  order_success_title: string;
  order_success_sub: string;
  order_print_receipt: string;
  order_share: string;
  order_back_home: string;
  order_new_btn: string;

  // Shops & Visits
  shops_search: string;
  shops_all_days: string;
  shops_debt_only: string;
  shops_add_btn: string;
  shop_debt: string;
  shop_no_debt: string;
  shop_visited_today: string;
  shop_not_visited: string;
  shop_action_visit: string;
  shop_action_order: string;
  shop_action_pko: string;
  shop_action_pko_short: string;
  shop_action_history: string;
  shop_action_history_short: string;
  pko_modal_title: string;
  pko_amount_label: string;
  pko_success: string;
  add_shop_title: string;
  add_shop_name: string;
  add_shop_owner: string;
  add_shop_phone: string;
  add_shop_address: string;
  add_shop_day: string;

  // History & Reports
  history_title: string;
  history_all: string;
  history_today: string;
  history_unsynced: string;
  history_empty: string;
  reports_title: string;
  reports_total_orders: string;
  reports_total_sales: string;
  reports_cash: string;
  reports_debt: string;
  reports_debt_collected: string;

  // Profile & Settings
  profile_title: string;
  profile_agent_code: string;
  profile_route: string;
  profile_language_title: string;
  profile_server_title: string;
  profile_server_url: string;
  profile_test_btn: string;
  profile_sync_btn: string;
  profile_logout_btn: string;
  profile_logout_confirm: string;
  profile_unsynced_docs: string;
  profile_last_sync: string;
  profile_never_synced: string;

  // Days of week
  day_mon: string;
  day_tue: string;
  day_wed: string;
  day_thu: string;
  day_fri: string;
  day_sat: string;
  day_all: string;

  // Additional Shop & Report Keys
  tab_today: string;
  tab_all_shops: string;
  tab_debt_shops: string;
  tab_visited_shops: string;
  shop_call_client: string;
  shop_open_map: string;
  shop_gps_register: string;
  shop_balance_debt: string;
  shop_no_debt_text: string;
  shop_responsible: string;
  shop_prev_orders: string;
  shop_no_prev_orders: string;
  rep_sales_day: string;
  rep_client_debts: string;
  rep_agent_cash: string;
  rep_summary_today: string;
  rep_docs_count: string;
  rep_orders_today: string;
  rep_debt_receivable: string;
  rep_debtors_count: string;
  rep_debtors_list: string;
  rep_cash_movement: string;
  rep_cash_received: string;
  rep_cash_turned_in: string;
  rep_cash_balance: string;
  add_shop_subtitle: string;
  add_shop_gps_btn: string;
  add_shop_saved_success: string;
}

export const mobileTranslations: Record<MobileLanguage, MobileTranslations> = {
  uz: {
    // General
    currency: "so'm",
    pcs: 'dona',
    block: 'blok',
    box: 'quti',
    kg: 'kg',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    confirm: 'Tasdiqlash',
    search: 'Qidirish',
    loading: 'Yuklanmoqda...',
    close: 'Yopish',
    success: 'Muvaffaqiyatli',
    error: 'Xatolik',
    warning: 'Diqqat',
    items_count: 'ta tovar',

    // Navigation
    tab_home: 'Asosiy',
    tab_shops: 'Marshrut',
    tab_catalog: 'Tovarlar',
    tab_history: 'Hujjatlar',
    tab_reports: 'Hisobotlar',
    nav_shop_detail: 'Mijoz kartochkasi',
    nav_new_shop: 'Yangi savdo nuqtasi',
    nav_cart: 'Buyurtma tarkibi',
    nav_checkout: 'Hujjat parametrlari',
    nav_profile: 'Sozlamalar va Almashinuv',
    nav_reports_agent: 'Agent hisobotlari',
    nav_orders_journal: 'Hujjatlar jurnali',

    // Auth
    auth_brand: 'Mobi_R Qandolat',
    auth_subtitle: 'Savdo agenti avtorizatsiyasi',
    auth_scan_hint: 'Tizimga kirish uchun shaxsiy QR-kodingizni kameraga koʻrsating',
    auth_camera_permission: 'Kamera ruxsati zarur',
    auth_grant_camera: 'Kameraga ruxsat berish',
    auth_manual_title: 'Yoki demo agent profilini tanlang:',
    auth_enter_code: 'Agent kodini qoʻlda kiritish',
    auth_code_placeholder: 'AGENT-QND-101',
    auth_login_btn: 'Tizimga kirish',
    auth_error_title: 'Avtorizatsiya xatosi',
    auth_retry: 'Qayta urinish',
    auth_enter_code_alert: 'Iltimos, agent kodi yoki QR matnini kiriting',

    // Home
    home_brand: 'MOBI_R',
    home_to_export: 'Yuborishga:',
    home_base_actual: 'Baza yangilangan',
    home_sales_today: 'Bugungi savdo:',
    home_orders_count: 'Zakazlar soni:',
    home_cash_today: 'Kassa (Naqd):',
    home_route_plan: 'Marshrut rejasi:',
    home_visited: 'tashrif',
    home_of: 'dan',
    home_menu_route: 'Marshrut / Mijozlar',
    home_menu_order: 'Yangi Buyurtma',
    home_menu_docs: 'Hujjatlar jurnali',
    home_menu_sync: 'Maʼlumot almashish',
    home_menu_reports: 'Agent hisobotlari',
    home_menu_settings: 'Parametrlar',
    home_sync_title: 'Maʼlumotlar almashinuvi',
    home_sync_success: 'Sinxronizatsiya muvaffaqiyatli yakunlandi.',
    home_sync_failed: 'Sinxronizatsiya amalga oshmadi. Barcha maʼlumotlar qurilmada xavfsiz saqlanmoqda.',

    // Catalog
    catalog_search_placeholder: 'Tovar nomi yoki kodi...',
    catalog_all: 'Barchasi',
    catalog_cart_total: 'Savatchada:',
    catalog_order_btn: 'Buyurtmani rasmiylashtirish',
    catalog_in_stock: 'Qoldiq:',
    catalog_price_dona: 'Dona',
    catalog_price_blok: 'Blok',
    catalog_price_box: 'Quti',
    catalog_price_kg: 'Kg',
    catalog_added: 'Savatchaga qoʻshildi',

    // Cart & Checkout
    cart_title: 'Savatcha tarkibi',
    cart_empty: 'Savatcha boʻsh',
    cart_empty_sub: 'Tovarlar katalogidan mahsulot tanlang',
    cart_clear: 'Tozalash',
    cart_proceed: 'Davom etish',
    checkout_client: 'Xaridor (Doʻkon):',
    checkout_pay_method: 'Toʻlov turi',
    checkout_pay_cash: 'Naqd pul',
    checkout_pay_debt: 'Nasiya (Qarz)',
    checkout_pay_bank: 'Bank oʻtkazmasi',
    checkout_discount: 'Chegirma foizi (%):',
    checkout_notes: 'Buyurtma uchun izoh:',
    checkout_total_before: 'Boshlangʻich summa:',
    checkout_total_final: 'JAMI TOʻLOV:',
    checkout_confirm_btn: 'Buyurtmani tasdiqlash',
    checkout_confirm_title: 'Buyurtmani tasdiqlaysizmi?',
    checkout_confirm_msg: 'Hujjat lokal bazada saqlanadi va ofisga yuborish uchun navbatga qoʻyiladi.',
    order_success_title: 'Buyurtma Qabul Qilindi!',
    order_success_sub: 'Yuk xati raqami:',
    order_print_receipt: 'Chekni chop etish (PDF)',
    order_share: 'Ulashish',
    order_back_home: 'Bosh sahifa',
    order_new_btn: 'Yangi zakaz',

    // Shops
    shops_search: 'Doʻkon yoki manzil...',
    shops_all_days: 'Barcha kunlar',
    shops_debt_only: 'Faqat Qarzdorlar',
    shops_add_btn: '+ Yangi Doʻkon',
    shop_debt: 'Qarzi:',
    shop_no_debt: 'Qarzi yoʻq',
    shop_visited_today: 'Bugun kirilgan',
    shop_not_visited: 'Kutilmoqda',
    shop_action_visit: 'Tashrifni qayd etish',
    shop_action_order: 'Zakaz olish',
    shop_action_pko: 'Qarz toʻlovini olish (PKO)',
    shop_action_pko_short: 'PKO',
    shop_action_history: 'Oldingi zakazlar',
    shop_action_history_short: 'Tarix',
    pko_modal_title: 'Qarz toʻlovi (PKO)',
    pko_amount_label: 'Qabul qilingan summa (soʻm):',
    pko_success: 'Toʻlov qabul qilindi va mijoz qarzi kamaytirildi.',
    add_shop_title: 'Yangi Mijoz Qoʻshish',
    add_shop_name: 'Doʻkon nomi *',
    add_shop_owner: 'Doʻkon egasi *',
    add_shop_phone: 'Telefon raqami *',
    add_shop_address: 'Manzil *',
    add_shop_day: 'Marshrut kuni',

    // History & Reports
    history_title: 'Hujjatlar jurnali',
    history_all: 'Barchasi',
    history_today: 'Bugungi',
    history_unsynced: 'Yuborilmagan',
    history_empty: 'Hujjatlar mavjud emas',
    reports_title: 'Kunlik hisobot',
    reports_total_orders: 'Jami buyurtmalar:',
    reports_total_sales: 'Jami savdo summasi:',
    reports_cash: 'Kassa (Naqd pul):',
    reports_debt: 'Nasiyaga savdo:',
    reports_debt_collected: 'Qarz yigʻildi (PKO):',

    // Profile & Settings
    profile_title: 'Sozlamalar va Almashinuv',
    profile_agent_code: 'Agent kodi:',
    profile_route: 'Biriktirilgan hudud:',
    profile_language_title: 'ILOVA TILI / ЯЗЫК ИНТЕРФЕЙСА',
    profile_server_title: 'SERVER PARAMETRLARI (NESTJS)',
    profile_server_url: 'Server manzili (Cloudflare / API):',
    profile_test_btn: 'Aloqani tekshirish',
    profile_sync_btn: 'Toʻliq maʼlumot almashinuvi',
    profile_logout_btn: 'Agent profilidan chiqish',
    profile_logout_confirm: 'Profildan chiqib boshqa agent kodi bilan kirishni xohlaysizmi?',
    profile_unsynced_docs: 'Yuborilmagan hujjatlar:',
    profile_last_sync: 'Soʻnggi almashinuv:',
    profile_never_synced: 'Bugun oʻtkazilmadi',

    // Days of week
    day_mon: 'Dushanba',
    day_tue: 'Seshanba',
    day_wed: 'Chorshanba',
    day_thu: 'Payshanba',
    day_fri: 'Juma',
    day_sat: 'Shanba',
    day_all: 'Barchasi',

    // Additional Shop & Report Keys
    tab_today: 'Bugun',
    tab_all_shops: 'Barchasi',
    tab_debt_shops: 'Qarzdorlar',
    tab_visited_shops: 'Tashriflar',
    shop_call_client: 'Mijozga qoʻngʻiroq qilish',
    shop_open_map: 'Xaritada koʻrish',
    shop_gps_register: 'Tashrifni qayd etish (GPS)',
    shop_balance_debt: 'Doʻkon balansi / Qarzdorlik:',
    shop_no_debt_text: 'Qarzdorlik mavjud emas',
    shop_responsible: 'Doʻkon masʼuli:',
    shop_prev_orders: 'Doʻkonning oldingi buyurtmalari',
    shop_no_prev_orders: 'Hozircha buyurtmalar mavjud emas',
    rep_sales_day: 'Kunlik savdo',
    rep_client_debts: 'Mijozlar qarzi',
    rep_agent_cash: 'Agent kassasi',
    rep_summary_today: 'BUGUNGI UMUMIY HISOBOT',
    rep_docs_count: 'ta hujjat',
    rep_orders_today: 'KUN DAVOMIDAGI BUYURTMALAR',
    rep_debt_receivable: 'DEBITORLIK QARZDORLIGI',
    rep_debtors_count: 'Qarzdor nuqtalar soni:',
    rep_debtors_list: 'QARZDORLAR ROʻYXATI (KAMAYISH TARTIBIDA)',
    rep_cash_movement: 'NAQD PUL HARAKATI',
    rep_cash_received: 'Qabul qilingan naqd pul:',
    rep_cash_turned_in: 'Korxona kassasiga topshirildi:',
    rep_cash_balance: 'Agent kassasidagi qoldiq:',
    add_shop_subtitle: 'Doʻkon maʼlumotlari oflayn SQLite bazaga va server navbatiga saqlanadi',
    add_shop_gps_btn: 'Joriy turgan joy koordinatasini olish (GPS)',
    add_shop_saved_success: 'bazaga qoʻshildi va sinxronizatsiya navbatiga kiritildi.',
  },

  ru: {
    // General
    currency: 'сум',
    pcs: 'шт',
    block: 'блок',
    box: 'кор',
    kg: 'кг',
    cancel: 'Отмена',
    save: 'Сохранить',
    confirm: 'Подтвердить',
    search: 'Поиск',
    loading: 'Загрузка...',
    close: 'Закрыть',
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Внимание',
    items_count: 'позиций',

    // Navigation
    tab_home: 'Главная',
    tab_shops: 'Маршрут',
    tab_catalog: 'Товары',
    tab_history: 'Документы',
    tab_reports: 'Отчеты',
    nav_shop_detail: 'Карточка клиента',
    nav_new_shop: 'Новая торговая точка',
    nav_cart: 'Состав заказа',
    nav_checkout: 'Параметры документа',
    nav_profile: 'Параметры и Обмен',
    nav_reports_agent: 'Отчеты торгового агента',
    nav_orders_journal: 'Журнал документов',

    // Auth
    auth_brand: 'Моби-С Кондитер',
    auth_subtitle: 'Авторизация торгового представителя',
    auth_scan_hint: 'Наведите камеру на персональный QR-код для входа',
    auth_camera_permission: 'Требуется доступ к камере',
    auth_grant_camera: 'Разрешить доступ к камере',
    auth_manual_title: 'Или выберите демо-агента:',
    auth_enter_code: 'Ввести код агента вручную',
    auth_code_placeholder: 'AGENT-QND-101',
    auth_login_btn: 'Войти в систему',
    auth_error_title: 'Ошибка авторизации',
    auth_retry: 'Повторить попытку',
    auth_enter_code_alert: 'Пожалуйста, введите код агента или QR-строку',

    // Home
    home_brand: 'МОБИ-С',
    home_to_export: 'К выгрузке:',
    home_base_actual: 'База актуальна',
    home_sales_today: 'Продажи сегодня:',
    home_orders_count: 'Количество заказов:',
    home_cash_today: 'В кассе (Нал):',
    home_route_plan: 'План маршрута:',
    home_visited: 'посещено',
    home_of: 'из',
    home_menu_route: 'Маршрут / Клиенты',
    home_menu_order: 'Оформить заказ',
    home_menu_docs: 'Журнал документов',
    home_menu_sync: 'Обмен данными',
    home_menu_reports: 'Отчеты агента',
    home_menu_settings: 'Параметры',
    home_sync_title: 'Обмен данными с сервером',
    home_sync_success: 'Синхронизация завершена успешно.',
    home_sync_failed: 'Синхронизация не удалась. Все данные сохранены на устройстве.',

    // Catalog
    catalog_search_placeholder: 'Поиск по наименованию, артикулу...',
    catalog_all: 'Все категории',
    catalog_cart_total: 'В заказе:',
    catalog_order_btn: 'Оформить заявку',
    catalog_in_stock: 'Остаток:',
    catalog_price_dona: 'Шт',
    catalog_price_blok: 'Блок',
    catalog_price_box: 'Короб',
    catalog_price_kg: 'Кг',
    catalog_added: 'Добавлено в заказ',

    // Cart & Checkout
    cart_title: 'Состав заказа',
    cart_empty: 'Корзина пуста',
    cart_empty_sub: 'Выберите сладости из каталога товаров',
    cart_clear: 'Очистить',
    cart_proceed: 'Далее',
    checkout_client: 'Торговая точка (Клиент):',
    checkout_pay_method: 'Тип оплаты',
    checkout_pay_cash: 'Наличный расчет',
    checkout_pay_debt: 'Отсрочка (Долг)',
    checkout_pay_bank: 'Безналичный расчет',
    checkout_discount: 'Скидка (%):',
    checkout_notes: 'Примечание к заказу:',
    checkout_total_before: 'Сумма без скидки:',
    checkout_total_final: 'ИТОГО К ОПЛАТЕ:',
    checkout_confirm_btn: 'Провести и записать',
    checkout_confirm_title: 'Провести документ?',
    checkout_confirm_msg: 'Заказ будет сохранен в базе и подготовлен к передаче в офис.',
    order_success_title: 'Заказ Успешно Оформлен!',
    order_success_sub: 'Номер накладной:',
    order_print_receipt: 'Печать квитанции (PDF)',
    order_share: 'Поделиться',
    order_back_home: 'На главную',
    order_new_btn: 'Новый заказ',

    // Shops
    shops_search: 'Название точки, адрес...',
    shops_all_days: 'Все дни',
    shops_debt_only: 'Только с долгом',
    shops_add_btn: '+ Новая точка',
    shop_debt: 'Долг:',
    shop_no_debt: 'Нет долга',
    shop_visited_today: 'Визит оформлен',
    shop_not_visited: 'Ожидает визита',
    shop_action_visit: 'Оформить визит',
    shop_action_order: 'Новый заказ',
    shop_action_pko: 'Прием оплаты (ПКО)',
    shop_action_pko_short: 'ПКО',
    shop_action_history: 'История заявок',
    shop_action_history_short: 'История',
    pko_modal_title: 'Прием оплаты (ПКО)',
    pko_amount_label: 'Сумма оплаты (сум):',
    pko_success: 'Оплата успешно принята и долг погашен.',
    add_shop_title: 'Регистрация торговой точки',
    add_shop_name: 'Наименование магазина *',
    add_shop_owner: 'Ответственное лицо *',
    add_shop_phone: 'Номер телефона *',
    add_shop_address: 'Адрес точки *',
    add_shop_day: 'День маршрута',

    // History & Reports
    history_title: 'Журнал документов',
    history_all: 'Все',
    history_today: 'Сегодня',
    history_unsynced: 'Не выгружены',
    history_empty: 'Документы отсутствуют',
    reports_title: 'Итоги за день',
    reports_total_orders: 'Всего заказов:',
    reports_total_sales: 'Общая сумма продаж:',
    reports_cash: 'Касса наличными:',
    reports_debt: 'В долг (отсрочка):',
    reports_debt_collected: 'Собрано долгов (ПКО):',

    // Profile & Settings
    profile_title: 'Параметры и Обмен',
    profile_agent_code: 'Код агента:',
    profile_route: 'Закрепленный сектор:',
    profile_language_title: 'ЯЗЫК ИНТЕРФЕЙСА / ILOVA TILI',
    profile_server_title: 'ПАРАМЕТРЫ СЕРВЕРА (NESTJS)',
    profile_server_url: 'Адрес сервера (Cloudflare / API):',
    profile_test_btn: 'Проверить связь',
    profile_sync_btn: 'Полный обмен данными',
    profile_logout_btn: 'Сменить агента (Выход)',
    profile_logout_confirm: 'Вы действительно хотите выйти из профиля текущего агента?',
    profile_unsynced_docs: 'К выгрузке в базу:',
    profile_last_sync: 'Последний обмен:',
    profile_never_synced: 'Сегодня не проводился',

    // Days of week
    day_mon: 'Понедельник',
    day_tue: 'Вторник',
    day_wed: 'Среда',
    day_thu: 'Четверг',
    day_fri: 'Пятница',
    day_sat: 'Суббота',
    day_all: 'Все дни',

    // Additional Shop & Report Keys
    tab_today: 'Сегодня',
    tab_all_shops: 'Все',
    tab_debt_shops: 'С долгом',
    tab_visited_shops: 'Визиты',
    shop_call_client: 'Позвонить клиенту',
    shop_open_map: 'Показать на карте',
    shop_gps_register: 'Зафиксировать визит (GPS)',
    shop_balance_debt: 'Баланс / Задолженность клиента:',
    shop_no_debt_text: 'Задолженность отсутствует',
    shop_responsible: 'Ответственное лицо:',
    shop_prev_orders: 'История заказов клиента',
    shop_no_prev_orders: 'Заказы пока отсутствуют',
    rep_sales_day: 'Продажи за день',
    rep_client_debts: 'Долги клиентов',
    rep_agent_cash: 'Касса агента',
    rep_summary_today: 'СВОДНЫЙ ОТЧЕТ ЗА СЕГОДНЯ',
    rep_docs_count: 'документов',
    rep_orders_today: 'ЗАКАЗЫ В ТЕЧЕНИЕ ДНЯ',
    rep_debt_receivable: 'ДЕБИТОРСКАЯ ЗАДОЛЖЕННОСТЬ',
    rep_debtors_count: 'Количество точек с задолженностью:',
    rep_debtors_list: 'СПИСОК ДОЛЖНИКОВ (ПО УБЫВАНИЮ)',
    rep_cash_movement: 'ДВИЖЕНИЕ НАЛИЧНЫХ СРЕДСТВ',
    rep_cash_received: 'Принято наличными за день:',
    rep_cash_turned_in: 'Сдано в кассу предприятия:',
    rep_cash_balance: 'Остаток в кассе агента:',
    add_shop_subtitle: 'Данные сохраняются в локальной базе и очереди отправки на сервер',
    add_shop_gps_btn: 'Определить текущие координаты GPS',
    add_shop_saved_success: 'добавлена в базу и включена в очередь синхронизации.',
  },

  uz_cyrl: {
    // General
    currency: 'сўм',
    pcs: 'дона',
    block: 'блок',
    box: 'қути',
    kg: 'кг',
    cancel: 'Бекор қилиш',
    save: 'Сақлаш',
    confirm: 'Тасдиқлаш',
    search: 'Қидириш',
    loading: 'Юкланмоқда...',
    close: 'Ёпиш',
    success: 'Муваффақиятли',
    error: 'Хатолик',
    warning: 'Диққат',
    items_count: 'та товар',

    // Navigation
    tab_home: 'Асосий',
    tab_shops: 'Маршрут',
    tab_catalog: 'Товарлар',
    tab_history: 'Ҳужжатлар',
    tab_reports: 'Ҳисоботлар',
    nav_shop_detail: 'Мижоз карточкаси',
    nav_new_shop: 'Янги савдо нуқтаси',
    nav_cart: 'Буюртма таркиби',
    nav_checkout: 'Ҳужжат параметрлари',
    nav_profile: 'Созламалар ва Алмашинув',
    nav_reports_agent: 'Агент ҳисоботлари',
    nav_orders_journal: 'Ҳужжатлар журнали',

    // Auth
    auth_brand: 'Mobi_R Қандолат',
    auth_subtitle: 'Савдо агенти авторизацияси',
    auth_scan_hint: 'Тизимга кириш учун шахсий QR-кодингизни камерага кўрсатинг',
    auth_camera_permission: 'Камера рухсати зарур',
    auth_grant_camera: 'Камерага рухсат бериш',
    auth_manual_title: 'Ёки демо агент профилини танланг:',
    auth_enter_code: 'Агент кодини қўлда киритиш',
    auth_code_placeholder: 'AGENT-QND-101',
    auth_login_btn: 'Тизимга кириш',
    auth_error_title: 'Авторизация хатоси',
    auth_retry: 'Қайта уриниш',
    auth_enter_code_alert: 'Илтимос, агент коди ёки QR матнини киритинг',

    // Home
    home_brand: 'MOBI_R',
    home_to_export: 'Юборишга:',
    home_base_actual: 'База янгиланган',
    home_sales_today: 'Бугунги савдо:',
    home_orders_count: 'Заказлар сони:',
    home_cash_today: 'Касса (Нақд):',
    home_route_plan: 'Маршрут режаси:',
    home_visited: 'ташриф',
    home_of: 'дан',
    home_menu_route: 'Маршрут / Мижозлар',
    home_menu_order: 'Янги Буюртма',
    home_menu_docs: 'Ҳужжатлар журнали',
    home_menu_sync: 'Маълумот алмашиш',
    home_menu_reports: 'Агент ҳисоботлари',
    home_menu_settings: 'Параметрлар',
    home_sync_title: 'Маълумотлар алмашинуви',
    home_sync_success: 'Синхронизация муваффақиятли якунланди.',
    home_sync_failed: 'Синхронизация амалга ошмади. Барча маълумотлар қурилмада хавфсиз сақланмоқда.',

    // Catalog
    catalog_search_placeholder: 'Товар номи ёки коди...',
    catalog_all: 'Барчаси',
    catalog_cart_total: 'Саватчада:',
    catalog_order_btn: 'Буюртмани расмийлаштириш',
    catalog_in_stock: 'Қолдиқ:',
    catalog_price_dona: 'Дона',
    catalog_price_blok: 'Блок',
    catalog_price_box: 'Қути',
    catalog_price_kg: 'Кг',
    catalog_added: 'Саватчага қўшилди',

    // Cart & Checkout
    cart_title: 'Саватча таркиби',
    cart_empty: 'Саватча бўш',
    cart_empty_sub: 'Товарлар каталогидан маҳсулот танланг',
    cart_clear: 'Тозалаш',
    cart_proceed: 'Давом этиш',
    checkout_client: 'Харидор (Дўкон):',
    checkout_pay_method: 'Тўлов тури',
    checkout_pay_cash: 'Нақд пул',
    checkout_pay_debt: 'Насия (Қарз)',
    checkout_pay_bank: 'Банк ўтказмаси',
    checkout_discount: 'Чегирма фоизи (%):',
    checkout_notes: 'Буюртма учун изоҳ:',
    checkout_total_before: 'Бошланғич сумма:',
    checkout_total_final: 'ЖАМИ ТЎЛОВ:',
    checkout_confirm_btn: 'Буюртмани тасдиқлаш',
    checkout_confirm_title: 'Буюртмани тасдиқлайсизми?',
    checkout_confirm_msg: 'Ҳужжат локал базада сақланади ва офисга юбориш учун навбатга қўйилади.',
    order_success_title: 'Буюртма Қабул Қилинди!',
    order_success_sub: 'Юк хати рақами:',
    order_print_receipt: 'Чекни чоп этиш (PDF)',
    order_share: 'Улашиш',
    order_back_home: 'Бош саҳифа',
    order_new_btn: 'Янги заказ',

    // Shops
    shops_search: 'Дўкон ёки манзил...',
    shops_all_days: 'Барча кунлар',
    shops_debt_only: 'Фақат Қарздорлар',
    shops_add_btn: '+ Янги Дўкон',
    shop_debt: 'Қарзи:',
    shop_no_debt: 'Қарзи йўқ',
    shop_visited_today: 'Бугун кирилган',
    shop_not_visited: 'Кутилмоқда',
    shop_action_visit: 'Ташрифни қайд этиш',
    shop_action_order: 'Заказ олиш',
    shop_action_pko: 'Қарз тўловини олиш (ПКО)',
    shop_action_pko_short: 'ПКО',
    shop_action_history: 'Олдинги заказлар',
    shop_action_history_short: 'Тарих',
    pko_modal_title: 'Қарз тўлови (ПКО)',
    pko_amount_label: 'Қабул қилинган сумма (сўм):',
    pko_success: 'Тўлов қабул қилинди ва мижоз қарзи камайтирилди.',
    add_shop_title: 'Янги Мижоз Қўшиш',
    add_shop_name: 'Дўкон номи *',
    add_shop_owner: 'Дўкон эгаси *',
    add_shop_phone: 'Телефон рақами *',
    add_shop_address: 'Манзил *',
    add_shop_day: 'Маршрут куни',

    // History & Reports
    history_title: 'Ҳужжатлар журнали',
    history_all: 'Барчаси',
    history_today: 'Бугунги',
    history_unsynced: 'Юборилмаган',
    history_empty: 'Ҳужжатлар мавжуд эмас',
    reports_title: 'Кунлик ҳисобот',
    reports_total_orders: 'Жами буюртмалар:',
    reports_total_sales: 'Жами савдо суммаси:',
    reports_cash: 'Касса (Нақд пул):',
    reports_debt: 'Насияга савдо:',
    reports_debt_collected: 'Қарз йиғилди (ПКО):',

    // Profile & Settings
    profile_title: 'Созламалар ва Алмашинув',
    profile_agent_code: 'Агент коди:',
    profile_route: 'Бириктирилган ҳудуд:',
    profile_language_title: 'ИЛОВА ТИЛИ / ЯЗЫК ИНТЕРФЕЙСА',
    profile_server_title: 'СЕРВЕР ПАРАМЕТРЛАРИ (NESTJS)',
    profile_server_url: 'Сервер манзили (Cloudflare / API):',
    profile_test_btn: 'Алоқани текшириш',
    profile_sync_btn: 'Тўлиқ маълумот алмашинуви',
    profile_logout_btn: 'Агент профилидан чиқиш',
    profile_logout_confirm: 'Профилдан чиқиб бошқа агент коди билан киришни хоҳлайсизми?',
    profile_unsynced_docs: 'Юборилмаган ҳужжатлар:',
    profile_last_sync: 'Сўнгги алмашинув:',
    profile_never_synced: 'Бугун ўтказилмади',

    // Days of week
    day_mon: 'Душанба',
    day_tue: 'Сешанба',
    day_wed: 'Чоршанба',
    day_thu: 'Пайшанба',
    day_fri: 'Жума',
    day_sat: 'Шанба',
    day_all: 'Барчаси',

    // Additional Shop & Report Keys
    tab_today: 'Бугун',
    tab_all_shops: 'Барчаси',
    tab_debt_shops: 'Қарздорлар',
    tab_visited_shops: 'Ташрифлар',
    shop_call_client: 'Мижозга қўнғироқ қилиш',
    shop_open_map: 'Харитада кўриш',
    shop_gps_register: 'Ташрифни қайд этиш (GPS)',
    shop_balance_debt: 'Дўкон баланси / Қарздорлик:',
    shop_no_debt_text: 'Қарздорлик мавжуд эмас',
    shop_responsible: 'Дўкон масъули:',
    shop_prev_orders: 'Дўконнинг олдинги буюртмалари',
    shop_no_prev_orders: 'Ҳозирча буюртмалар мавжуд эмас',
    rep_sales_day: 'Кунлик савдо',
    rep_client_debts: 'Мижозлар қарзи',
    rep_agent_cash: 'Агент кассаси',
    rep_summary_today: 'БУГУНГИ УМУМИЙ ҲИСОБОТ',
    rep_docs_count: 'та ҳужжат',
    rep_orders_today: 'КУН ДАВОМИДАГИ БУЮРТМАЛАР',
    rep_debt_receivable: 'ДЕБИТОРЛИК ҚАРЗДОРЛИГИ',
    rep_debtors_count: 'Қарздор нуқталар сони:',
    rep_debtors_list: 'ҚАРЗДОРЛАР РЎЙХАТИ (КАМАЙИШ ТАРТИБИДА)',
    rep_cash_movement: 'НАҚД ПУЛ ҲАРАКАТИ',
    rep_cash_received: 'Қабул қилинган нақд пул:',
    rep_cash_turned_in: 'Корхона кассасига топширилди:',
    rep_cash_balance: 'Агент кассасидаги қолдиқ:',
    add_shop_subtitle: 'Дўкон маълумотлари офлайн SQLite базага ва сервер навбатига сақланади',
    add_shop_gps_btn: 'Жорий турган жой координатасини олиш (GPS)',
    add_shop_saved_success: 'базага қўшилди ва синхронизация навбатига киритилди.',
  },
};
