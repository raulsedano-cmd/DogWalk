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
        // Log muy distintivo para saber si cargó la versión nueva
        console.log("🚀 Lógica de Notificaciones V3 (ULTRA-ESTABLE) Activada");
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

    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();

        console.log('📡 Subscribiendo a la tabla "Notification"...');

        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Notification' },
                (payload) => {
                    console.log('🔔 ¡NUEVO EVENTO!', payload);
                    if (payload.new.userId === user.id) {
                        const newNotif = parseNotification(payload.new);
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        toast.success(newNotif.title || "Nueva notificación", { icon: '🐶' });
                    }
                }
            )
            .subscribe((status) => {
                console.log('📶 ESTADO REALTIME:', status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('🚨 Error: Revisa que Realtime esté activado para la tabla en Supabase.');
                }
            });

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-primary-600">
                <div className="flex items-center gap-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="text-[8px] font-bold text-emerald-500 border border-emerald-200 px-1 rounded">V3</span>
                </div>
                {unreadCount > 0 && <span className="absolute top-0 right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-xl border p-4 z-50">
                    <h3 className="font-bold border-b pb-2 mb-2">Notificaciones</h3>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? <p className="text-gray-400 text-center py-4 text-sm">Sin mensajes nuevos</p> :
                            notifications.map(n => (
                                <div key={n.id} className="py-2 border-b last:border-0">
                                    <p className="font-bold text-xs">{n.title}</p>
                                    <p className="text-[11px] text-gray-600">{n.message}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
