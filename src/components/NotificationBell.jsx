import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getLatestUnreadNotifications,
  getUnreadNotificationsCount,
  readAllNotifications,
  readNotification,
} from '../api';
import { bffWsUrl } from '../config';

const DISMISS_ANIMATION_MS = 320;

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [dismissingIds, setDismissingIds] = useState(() => new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const bellButtonRef = useRef(null);
  const bellIconRef = useRef(null);
  const badgeRef = useRef(null);
  const isOpenRef = useRef(false);
  const previousUnreadCountRef = useRef(0);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch (requestError) {
      console.error('Ошибка загрузки количества уведомлений:', requestError);
    }
  }, []);

  const loadLatestUnread = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const latest = await getLatestUnreadNotifications();
      setNotifications(Array.isArray(latest) ? latest : []);
      setDismissingIds(new Set());
    } catch (requestError) {
      console.error('Ошибка загрузки уведомлений:', requestError);
      setError('Не удалось загрузить уведомления');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current) {
      const button = bellButtonRef.current;
      const icon = bellIconRef.current;
      const badge = badgeRef.current;

      button?.getAnimations().forEach(animation => animation.cancel());
      icon?.getAnimations().forEach(animation => animation.cancel());
      badge?.getAnimations().forEach(animation => animation.cancel());

      button?.animate([
        { transform: 'scale(1)', background: 'rgba(255,255,255,0.035)', boxShadow: '0 0 0 rgba(99,102,241,0)' },
        { transform: 'scale(1.14)', background: 'rgba(99,102,241,0.3)', boxShadow: '0 0 30px rgba(99,102,241,0.65)', offset: 0.3 },
        { transform: 'scale(1.05)', background: 'rgba(99,102,241,0.18)', boxShadow: '0 0 18px rgba(99,102,241,0.38)', offset: 0.7 },
        { transform: 'scale(1)', background: 'rgba(255,255,255,0.035)', boxShadow: '0 0 0 rgba(99,102,241,0)' },
      ], {
        duration: 1100,
        easing: 'ease-out',
      });

      icon?.animate([
        { transform: 'rotate(0deg) scale(1)' },
        { transform: 'rotate(24deg) scale(1.18)', offset: 0.15 },
        { transform: 'rotate(-22deg) scale(1.18)', offset: 0.3 },
        { transform: 'rotate(17deg) scale(1.12)', offset: 0.45 },
        { transform: 'rotate(-12deg) scale(1.08)', offset: 0.6 },
        { transform: 'rotate(7deg) scale(1.04)', offset: 0.75 },
        { transform: 'rotate(0deg) scale(1)' },
      ], {
        duration: 950,
        easing: 'ease-in-out',
      });

      badge?.animate([
        { transform: 'scale(0.65)', opacity: 0.65 },
        { transform: 'scale(1.45)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1)', opacity: 1 },
      ], {
        duration: 650,
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1.35)',
      });
    }
    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    let socket;
    let reconnectTimer;
    let closedByComponent = false;

    const connect = () => {
      socket = new WebSocket(bffWsUrl('/ws/notifications'));

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== 'NOTIFICATION_CREATED' || !payload.notification) {
            return;
          }

          setUnreadCount(current => current + 1);
          if (isOpenRef.current) {
            loadLatestUnread();
          }
        } catch (parseError) {
          console.error('Ошибка обработки WebSocket уведомления:', parseError);
        }
      };

      socket.onclose = () => {
        if (!closedByComponent) {
          reconnectTimer = window.setTimeout(connect, 5000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      closedByComponent = true;
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [loadLatestUnread]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleToggle = async () => {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);
    if (nextOpenState) {
      await loadLatestUnread();
      await refreshCount();
    }
  };

  const animateRemove = useCallback((ids, onComplete) => {
    const normalizedIds = Array.isArray(ids) ? ids : [ids];
    setDismissingIds(current => {
      const next = new Set(current);
      normalizedIds.forEach(id => next.add(id));
      return next;
    });

    window.setTimeout(() => {
      setNotifications(current => current.filter(item => !normalizedIds.includes(item.id)));
      setDismissingIds(current => {
        const next = new Set(current);
        normalizedIds.forEach(id => next.delete(id));
        return next;
      });
      onComplete?.();
    }, DISMISS_ANIMATION_MS);
  }, []);

  const handleRead = async (notification) => {
    if (dismissingIds.has(notification.id)) {
      return;
    }

    try {
      await readNotification(notification.id);
      animateRemove(notification.id);
      setUnreadCount(current => Math.max(0, current - 1));
      await refreshCount();
    } catch (requestError) {
      console.error('Ошибка чтения уведомления:', requestError);
      setError('Не удалось пометить уведомление прочитанным');
    }
  };

  const handleReadAll = async () => {
    if (notifications.length === 0 || isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);
    setError('');
    const ids = notifications.map(notification => notification.id);

    try {
      await readAllNotifications();
      animateRemove(ids, () => setUnreadCount(0));
      await refreshCount();
    } catch (requestError) {
      console.error('Ошибка чтения всех уведомлений:', requestError);
      setError('Не удалось пометить все уведомления прочитанными');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        ref={bellButtonRef}
        type="button"
        className="notification-bell-button"
        onClick={handleToggle}
        aria-label="Уведомления"
        title="Уведомления"
      >
        <svg ref={bellIconRef} viewBox="0 0 24 24" aria-hidden="true" className="notification-bell-icon">
          <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1l-2-2Z" />
          <path d="M9.5 21a2.7 2.7 0 0 0 5 0" />
        </svg>
        {unreadCount > 0 && (
          <span ref={badgeRef} className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Непрочитанные уведомления</span>
            <div className="notification-dropdown-actions">
              <button
                type="button"
                onClick={handleReadAll}
                disabled={notifications.length === 0 || isMarkingAll}
              >
                Прочитать все
              </button>
              <button type="button" onClick={loadLatestUnread}>
                Обновить
              </button>
            </div>
          </div>

          {isLoading && <div className="notification-empty">Загрузка...</div>}
          {!isLoading && error && <div className="notification-error">{error}</div>}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="notification-empty">Новых уведомлений нет</div>
          )}
          {!isLoading && !error && notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item${dismissingIds.has(notification.id) ? ' is-dismissing' : ''}`}
            >
              <div className="notification-item-content">
                <span className="notification-item-title">{notification.title}</span>
                <span className="notification-item-message">{notification.message}</span>
                <span className="notification-item-time">{formatNotificationDate(notification.createdAt)}</span>
              </div>
              <button
                type="button"
                className="notification-read-button"
                onClick={() => handleRead(notification)}
                disabled={dismissingIds.has(notification.id)}
                aria-label="Пометить уведомление прочитанным"
                title="Пометить прочитанным"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                  <path d="m5 7 7 5.5L19 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(value) {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
