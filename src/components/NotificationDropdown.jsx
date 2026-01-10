import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const parseNotification = (n) => {
        if (!n || !n.message) return { ...n, link: null };
        const parts = n.message.split('|LINK:');
        return { ...n, message: parts[0], link: parts[1] || null };
    };

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            const parsed = data.map(parseNotification);
            setNotifications(parsed);
            setUnreadCount(parsed.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('API Error:', error);
        }
    };

    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Notification' },
                (payload) => {
                    if (payload.new.userId === user.id) {
                        const newNotif = parseNotification(payload.new);
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // Alerta visual que al hacer clic también marca como leída
                        toast.custom((t) => (
                            <div
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    handleNotificationClick(newNotif);
                                }}
                                className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer border-l-4 border-primary-500`}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5 text-2xl">🐶</div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-bold text-gray-900">{newNotif.title}</p>
                                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{newNotif.message}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ), { duration: 6000 });
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const handleNotificationClick = async (notif) => {
        if (!notif) return;

        // 1. Navegar si hay link
        if (notif.link) navigate(notif.link);

        // 2. Si no estaba leída, marcar como leída en servidor y local
        if (!notif.isRead) {
            try {
                // Actualizar UI inmediatamente para respuesta rápida
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));

                // Llamada al backend
                await notificationService.markAsRead(notif.id);
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
        setIsOpen(false);
    };

    const handleMarkAllAsRead = async () => {
        try {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'WALK_COMPLETED': return '🏆';
            case 'OFFER_RECEIVED': return '💰';
            case 'WALK_ASSIGNED': return '📅';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
                title="Notificaciones"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3 mb-3">
                        <h3 className="font-bold text-gray-800 tracking-tight">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllAsRead} className="text-[10px] font-bold text-primary-600 hover:text-primary-800 uppercase tracking-tighter">
                                Leer todas
                            </button>
                        )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="text-center py-10">
                                <span className="text-4xl opacity-20">📭</span>
                                <p className="text-gray-400 text-xs mt-3">Sin notificaciones nuevas</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all cursor-pointer rounded-xl px-3 mb-1 flex items-start gap-3 ${!n.isRead ? 'bg-primary-50/10' : ''}`}
                                >
                                    <div className="text-xl mt-1">{getTypeIcon(n.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm leading-tight pr-4 ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                                            {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></span>}
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                        <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{new Date(n.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
