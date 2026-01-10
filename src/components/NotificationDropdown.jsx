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
        console.log("🚀 Lógica de Notificaciones V5 (AUTO-RETRY) Activada");
    }, []);

    const parseNotification = (n) => {
        if (!n || !n.message) return { ...n, link: null };
        const parts = n.message.split('|LINK:');
        return { ...n, message: parts[0], link: parts[1] || null };
    };

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data.map(parseNotification));
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error('API Error:', error);
        }
    };

    const subscribeToTable = (tableName) => {
        console.log(`📡 Intentando conectar a la tabla: "${tableName}"...`);

        const channel = supabase
            .channel(`notifs-${tableName}-${Date.now()}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: tableName },
                (payload) => {
                    if (payload.new.userId === user.id) {
                        console.log('🔔 ¡NOTIFICACIÓN RECIBIDA!', payload.new);
                        const newNotif = parseNotification(payload.new);
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        toast.success(newNotif.title || "Nueva notificación", { icon: '🐶' });
                    }
                }
            )
            .subscribe((status) => {
                console.log(`📶 ESTADO [${tableName}]:`, status);
                if (status === 'CHANNEL_ERROR' && tableName === 'Notification') {
                    console.warn('⚠️ Falló PascalCase, reintentando con minúsculas...');
                    supabase.removeChannel(channel);
                    subscribeToTable('notification');
                }
            });

        return channel;
    };

    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();

        // Iniciamos el intento con PascalCase (default de Prisma)
        const channel = subscribeToTable('Notification');

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <div className="flex items-center gap-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-[8px] font-bold text-orange-500 border border-orange-200 px-1 rounded shadow-sm">V5</span>
                </div>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                        <h3 className="font-bold text-gray-800 tracking-tight">Centro de Avisos</h3>
                        <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-bold">REALTIME</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                            <div className="text-center py-10">
                                <span className="text-4xl filter grayscale">🦴</span>
                                <p className="text-gray-400 text-xs mt-3 font-medium">Buzón vacío por ahora</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-all cursor-pointer rounded-xl px-3 mb-1 ${!n.isRead ? 'bg-primary-50/10 border-l-4 border-l-primary-500' : ''}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="font-bold text-xs text-gray-900 leading-tight">{n.title}</p>
                                        {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 animate-ping"></span>}
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                    <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1 font-bold">
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        {new Date(n.createdAt).toLocaleTimeString()}
                                    </p>
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
