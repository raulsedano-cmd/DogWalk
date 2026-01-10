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

    useEffect(() => {
        console.log("🛠️ Componente NotificationDropdown (v.Ultra-Estable) montado");
        console.log("👤 Usuario logueado:", user ? user.id : "SÍ");
    }, [user]);

    const parseNotification = (n) => {
        if (!n || !n.message) return { ...n, link: null };
        const parts = n.message.split('|LINK:');
        return { ...n, message: parts[0], link: parts[1] || null };
    };

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            const parsedData = data.map(parseNotification);
            setNotifications(parsedData);
            setUnreadCount(parsedData.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('❌ Error API:', error);
        }
    };

    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications();

        console.log('🔥 Intentando conexión Realtime ultra-estable...');

        // Usamos una suscripción más amplia para evitar errores de bindings de Postgres
        // Filtramos manualmente en la respuesta para mayor seguridad
        const channel = supabase
            .channel('global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Notification' // Probamos con el nombre de Prisma
                },
                (payload) => {
                    // FILTRO MANUAL: Solo procesar si es para este usuario
                    if (payload.new && payload.new.userId === user.id) {
                        console.log('🚀 ¡NOTIFICACIÓN PERSONAL RECIBIDA!', payload.new);
                        const newNotif = parseNotification(payload.new);
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        toast.success(newNotif.title || "Nueva notificación", {
                            icon: '🔔',
                            duration: 5000
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('🌐 ESTADO CONEXIÓN SUPABASE:', status);
            });

        return () => {
            console.log('🔌 Desconectando...');
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const handleNotificationClick = async (notif) => {
        if (notif.link) navigate(notif.link);
        if (!notif.isRead) {
            try {
                await notificationService.markAsRead(notif.id);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
        setIsOpen(false);
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
                id="notification-bell"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Notificaciones</h3>
                        {unreadCount > 0 && <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">NUEVAS</span>}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <span className="text-4xl block mb-2">📭</span>
                                <p className="text-gray-400 text-sm">No tienes notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 flex space-x-3 ${!notif.isRead ? 'bg-primary-50/20' : ''}`}
                                >
                                    <div className="text-2xl">{getTypeIcon(notif.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 leading-tight">{notif.title}</p>
                                        <p className="text-xs text-gray-600 truncate mt-1">{notif.message}</p>
                                        <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    {!notif.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>}
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
