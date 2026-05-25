"use client";

import { useEffect } from "react";

type Language = "ru" | "uk";

const storageKeyPrefix = "neoschool-language";
const languageEvent = "neoschool-language-change";
const routeEvent = "neoschool-route-change";

const exactTranslations = new Map<string, string>([
  ["онлайн-школа", "онлайн-школа"],
  ["Основная навигация", "Основна навігація"],
  ["Ученикам", "Учням"],
  ["Учителям", "Вчителям"],
  ["Войти", "Увійти"],
  ["Выйти", "Вийти"],
  ["Админ", "Адмін"],
  ["Администратор", "Адміністратор"],
  ["Кабинет ученика", "Кабінет учня"],
  ["Кабинет учителя", "Кабінет вчителя"],
  ["Кабинет", "Кабінет"],
  ["Платформа", "Платформа"],
  ["Ученики", "Учні"],
  ["Учителя", "Вчителі"],
  ["Урок", "Урок"],
  ["Уроки", "Уроки"],
  ["Расписание", "Розклад"],
  ["Домашнее задание", "Домашнє завдання"],
  ["Домашнее задание после урока", "Домашнє завдання після уроку"],
  ["Чат урока", "Чат уроку"],
  ["Чат и домашнее задание", "Чат і домашнє завдання"],
  ["Сообщения", "Повідомлення"],
  ["Отправить", "Надіслати"],
  ["Скачать", "Завантажити"],
  ["Сохранить", "Зберегти"],
  ["Сохраняю...", "Зберігаю..."],
  ["Закрыть", "Закрити"],
  ["Назад", "Назад"],
  ["Редактировать сессию", "Редагувати сесію"],
  ["Закрыть редактирование", "Закрити редагування"],
  ["Подключиться к сессии", "Підключитися до сесії"],
  ["Подключиться к уроку", "Підключитися до уроку"],
  ["Запустить видеозвонок", "Запустити відеодзвінок"],
  ["Запускаем видеозвонок", "Запускаємо відеодзвінок"],
  ["Подключаем видеокомнату...", "Підключаємо відеокімнату..."],
  ["Видеозвонок пока не настроен. Сообщите администратору платформы.", "Відеодзвінок поки не налаштований. Повідомте адміністратора платформи."],
  ["Видеоурок готов к запуску", "Відеоурок готовий до запуску"],
  ["Наблюдение за видеоуроком", "Спостереження за відеоуроком"],
  ["Проверьте микрофон, камеру и экран перед входом", "Перевірте мікрофон, камеру та екран перед входом"],
  ["Нажмите запуск, чтобы подключиться без камеры и микрофона", "Натисніть запуск, щоб підключитися без камери та мікрофона"],
  ["Выключить микрофон", "Вимкнути мікрофон"],
  ["Включить микрофон", "Увімкнути мікрофон"],
  ["Выключить камеру", "Вимкнути камеру"],
  ["Включить камеру", "Увімкнути камеру"],
  ["Отключить экран", "Вимкнути екран"],
  ["Включить демонстрацию экрана", "Увімкнути демонстрацію екрана"],
  ["Видео 720p", "Відео 720p"],
  ["Режим наблюдения", "Режим спостереження"],
  ["Демонстрация экрана включена", "Демонстрацію екрана увімкнено"],
  ["Урок не найден", "Урок не знайдено"],
  ["Урок пока не найден.", "Урок поки не знайдено."],
  ["Урок уже начался", "Урок уже почався"],
  ["Урок не назначен", "Урок не призначено"],
  ["Уроков пока нет.", "Уроків поки немає."],
  ["ДЗ еще не выполнено учеником", "ДЗ ще не виконано учнем"],
  ["Ученик отметил ДЗ выполненным", "Учень позначив ДЗ виконаним"],
  ["ДЗ прикреплено", "ДЗ прикріплено"],
  ["ДЗ выполнено учеником", "ДЗ виконано учнем"],
  ["ДЗ не прикреплено", "ДЗ не прикріплено"],
  ["Отметить выполнено", "Позначити виконаним"],
  ["Отметить ДЗ прикрепленным", "Позначити ДЗ прикріпленим"],
  ["Ссылка прикреплена", "Посилання прикріплено"],
  ["Ссылка не прикреплена", "Посилання не прикріплено"],
  ["Zoom-ссылка", "Zoom-посилання"],
  ["Ожидает прикрепления", "Очікує прикріплення"],
  ["Изменить ссылку Zoom", "Змінити посилання Zoom"],
  ["Прикрепить ссылку Zoom", "Прикріпити посилання Zoom"],
  ["Вставьте ссылку Zoom", "Вставте посилання Zoom"],
  ["Чат временно недоступен", "Чат тимчасово недоступний"],
  ["Сообщение в чат", "Повідомлення в чат"],
  ["Написать сообщение...", "Написати повідомлення..."],
  ["Наблюдатель не пишет в чат", "Спостерігач не пише в чат"],
  ["Нет активного урока", "Немає активного уроку"],
  ["Файл слишком большой. Сейчас лимит 2.5 MB.", "Файл завеликий. Поточний ліміт 2.5 MB."],
  ["Не удалось отправить сообщение", "Не вдалося надіслати повідомлення"],
  ["Не удалось сохранить изображение.", "Не вдалося зберегти зображення."],
  ["Открыть", "Відкрити"],
  ["Свернуть", "Згорнути"],
  ["На весь экран", "На весь екран"],
  ["Закончить урок", "Завершити урок"],
  ["Свернуть чат", "Згорнути чат"],
  ["Развернуть чат", "Розгорнути чат"],
  ["главная", "головна"],
  ["главный экран", "головний екран"],
  ["живые счетчики", "живі лічильники"],
  ["список профилей", "список профілів"],
  ["календарь", "календар"],
  ["открыть календарь", "відкрити календар"],
  ["открыть страницу урока", "відкрити сторінку уроку"],
  ["активный профиль", "активний профіль"],
  ["полный доступ", "повний доступ"],
  ["Супер админ · полный доступ", "Суперадмін · повний доступ"],
  ["Учитель · онлайн", "Вчитель · онлайн"],
  ["Учитель · не онлайн", "Вчитель · не онлайн"],
  ["Ученик · онлайн", "Учень · онлайн"],
  ["Ученик · не онлайн", "Учень · не онлайн"],
  ["Ученик · активный профиль", "Учень · активний профіль"],
  ["Учитель · Europe/Budapest", "Вчитель · Europe/Budapest"],
  ["Ученик · Europe/Budapest", "Учень · Europe/Budapest"],
  ["Учитель еще не назначен", "Вчителя ще не призначено"],
  ["Ученик еще не назначен", "Учня ще не призначено"],
  ["Учитель пока не назначен.", "Вчителя поки не призначено."],
  ["Домашнее задание не прикреплено", "Домашнє завдання не прикріплено"],
  ["Урок ждет прикрепления ДЗ учителем", "Урок очікує прикріплення ДЗ вчителем"],
  ["Зарегистрироваться", "Зареєструватися"],
  ["Зарегистрировать ученика", "Зареєструвати учня"],
  ["Зарегистрировать учителя", "Зареєструвати вчителя"],
  ["Нет профиля?", "Немає профілю?"],
  ["Отправить CV", "Надіслати CV"],
  ["Войти как учитель", "Увійти як вчитель"],
  ["Мини-профиль", "Міні-профіль"],
  ["Дата и время", "Дата і час"],
  ["До начала", "До початку"],
  ["Ближайший урок", "Найближчий урок"],
  ["Следующий урок под рукой", "Наступний урок під рукою"],
  ["Следующий урок пока не назначен", "Наступний урок поки не призначено"],
  ["Ожидает назначения", "Очікує призначення"],
  ["Язык", "Мова"],
  ["Тема", "Тема"],
  ["Сессий пока нет. Они появятся после создания уроков в расписании.", "Сесій поки немає. Вони з'являться після створення уроків у розкладі."],
  ["По выбранным фильтрам сессий нет.", "За вибраними фільтрами сесій немає."],
  ["В этой сессии пока нет сообщений.", "У цій сесії поки немає повідомлень."],
]);

const phraseTranslations: Array<[string, string]> = [
  ["Учитель", "Вчитель"],
  ["Учителя", "Вчителі"],
  ["учитель", "вчитель"],
  ["учителя", "вчителя"],
  ["Ученик", "Учень"],
  ["Ученики", "Учні"],
  ["ученик", "учень"],
  ["ученика", "учня"],
  ["ученику", "учню"],
  ["учеником", "учнем"],
  ["Кабинет", "Кабінет"],
  ["Расписание", "Розклад"],
  ["расписании", "розкладі"],
  ["Домашнее задание", "Домашнє завдання"],
  ["Домашнее", "Домашнє"],
  ["задание", "завдання"],
  ["Уроки", "Уроки"],
  ["Урок", "Урок"],
  ["урока", "уроку"],
  ["уроку", "уроку"],
  ["урок", "урок"],
  ["Чат", "Чат"],
  ["Сообщения", "Повідомлення"],
  ["сообщение", "повідомлення"],
  ["сообщений", "повідомлень"],
  ["Ссылка", "Посилання"],
  ["ссылку", "посилання"],
  ["ссылка", "посилання"],
  ["прикреплена", "прикріплено"],
  ["прикреплено", "прикріплено"],
  ["прикрепления", "прикріплення"],
  ["выполнено", "виконано"],
  ["выполненным", "виконаним"],
  ["назначен", "призначено"],
  ["назначена", "призначено"],
  ["назначено", "призначено"],
  ["назначения", "призначення"],
  ["страницу", "сторінку"],
  ["главная", "головна"],
  ["главный", "головний"],
  ["экран", "екран"],
  ["Экран", "Екран"],
  ["камера", "камера"],
  ["Камера", "Камера"],
  ["микрофон", "мікрофон"],
  ["Микрофон", "Мікрофон"],
  ["включить", "увімкнути"],
  ["Включить", "Увімкнути"],
  ["выключить", "вимкнути"],
  ["Выключить", "Вимкнути"],
  ["отключить", "вимкнути"],
  ["Отключить", "Вимкнути"],
  ["Запустить", "Запустити"],
  ["Запускаем", "Запускаємо"],
  ["Подключиться", "Підключитися"],
  ["Подключаем", "Підключаємо"],
  ["Зарегистрировать", "Зареєструвати"],
  ["Зарегистрироваться", "Зареєструватися"],
  ["Отправить", "Надіслати"],
  ["Сохранить", "Зберегти"],
  ["Сохраняю", "Зберігаю"],
  ["Скачать", "Завантажити"],
  ["Закрыть", "Закрити"],
  ["Войти", "Увійти"],
  ["Выйти", "Вийти"],
  ["Админ", "Адмін"],
  ["Администратор", "Адміністратор"],
  ["Платформа", "Платформа"],
  ["Профиль", "Профіль"],
  ["профиль", "профіль"],
  ["профилей", "профілів"],
  ["онлайн-школа", "онлайн-школа"],
  ["май", "травень"],
  ["мая", "травня"],
  ["января", "січня"],
  ["февраля", "лютого"],
  ["марта", "березня"],
  ["апреля", "квітня"],
  ["июня", "червня"],
  ["июля", "липня"],
  ["августа", "серпня"],
  ["сентября", "вересня"],
  ["октября", "жовтня"],
  ["ноября", "листопада"],
  ["декабря", "грудня"],
  ["Пн", "Пн"],
  ["Вт", "Вт"],
  ["Ср", "Ср"],
  ["Чт", "Чт"],
  ["Пт", "Пт"],
  ["Сб", "Сб"],
  ["Вс", "Нд"],
];

const sortedPhrases = [...phraseTranslations].sort((left, right) => right[0].length - left[0].length);
const attributeNames = ["aria-label", "data-tooltip", "placeholder", "title"];
const ignoredTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function getLanguageScope() {
  if (typeof window === "undefined") return "public";

  const [, role, accountId] = window.location.pathname.split("/");
  if ((role === "student" || role === "teacher") && accountId) {
    return `${role}:${accountId}`;
  }
  if (role === "admin") return "admin";

  return "public";
}

function getLanguageStorageKey() {
  return `${storageKeyPrefix}:${getLanguageScope()}`;
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "ru";
  return window.localStorage.getItem(getLanguageStorageKey()) === "uk" ? "uk" : "ru";
}

function translateText(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const trimmed = value.trim();

  if (!trimmed) return value;

  const exact = exactTranslations.get(trimmed);
  if (exact) return `${leading}${exact}${trailing}`;

  let translated = trimmed;
  for (const [from, to] of sortedPhrases) {
    translated = translated.split(from).join(to);
  }

  return `${leading}${translated}${trailing}`;
}

function shouldTranslateTextNode(node: Text) {
  const parent = node.parentElement;
  if (!parent || ignoredTags.has(parent.tagName)) return false;
  if (parent.closest("[data-no-translate]")) return false;
  return Boolean(node.nodeValue?.trim());
}

function collectTextNodes(root: ParentNode) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return shouldTranslateTextNode(node as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  return nodes;
}

function translateAttributes(root: ParentNode, language: Language) {
  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(root.querySelectorAll("*"));

  for (const element of elements) {
    if (element.closest("[data-no-translate]")) continue;

    let attributes = originalAttributes.get(element);
    if (!attributes) {
      attributes = new Map();
      originalAttributes.set(element, attributes);
    }

    for (const name of attributeNames) {
      const value = element.getAttribute(name);
      if (!value) continue;
      if (!attributes.has(name)) attributes.set(name, value);
      const source = attributes.get(name) ?? value;
      element.setAttribute(name, language === "uk" ? translateText(source) : source);
    }
  }
}

function applyLanguage(language: Language, root: ParentNode = document.body) {
  document.documentElement.lang = language === "uk" ? "uk" : "ru";

  for (const node of collectTextNodes(root)) {
    if (!originalText.has(node)) {
      originalText.set(node, node.nodeValue ?? "");
    }
    const source = originalText.get(node) ?? "";
    node.nodeValue = language === "uk" ? translateText(source) : source;
  }

  translateAttributes(root, language);
}

export function setNeoSchoolLanguage(language: Language) {
  window.localStorage.setItem(getLanguageStorageKey(), language);
  window.dispatchEvent(new CustomEvent(languageEvent, { detail: language }));
}

export function LanguageSwitcher() {
  return (
    <button
      aria-label="Переключить язык"
      className="language-switcher"
      data-no-translate
      onClick={() => setNeoSchoolLanguage(getInitialLanguage() === "uk" ? "ru" : "uk")}
      type="button"
    >
      <span>RU</span>
      <span>UA</span>
    </button>
  );
}

export function LanguageRuntime() {
  useEffect(() => {
    let language = getInitialLanguage();
    let frame = 0;
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const scheduleApply = (root: ParentNode = document.body) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyLanguage(language, root));
    };

    const sync = (event?: Event) => {
      if (event instanceof StorageEvent && event.key && event.key !== getLanguageStorageKey()) return;
      const customEvent = event as CustomEvent<Language> | undefined;
      language = customEvent?.detail ?? getInitialLanguage();
      scheduleApply();
    };

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event(routeEvent));
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event(routeEvent));
      return result;
    };

    scheduleApply();
    window.addEventListener(languageEvent, sync);
    window.addEventListener(routeEvent, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("popstate", sync);

    const observer = new MutationObserver((mutations) => {
      if (language !== "uk") return;
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            scheduleApply(node.parentNode ?? document.body);
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener(languageEvent, sync);
      window.removeEventListener(routeEvent, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("popstate", sync);
      observer.disconnect();
    };
  }, []);

  return null;
}
