/**
 * Rooms Page
 * 
 * หน้าแสดงรายการห้องว่าง
 * 
 * @module app/rooms/page
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Room {
  id: string;
  roomNumber: string;
  floorNumber: number;
  monthlyRent: number;
  deposit: number;
  areaSqm: number;
  description: string;
  amenities: string[];
  building: {
    id: string;
    name: string;
    address: string;
  };
}

/**
 * Rooms Page Component
 * 
 * @returns Rooms page JSX
 */
export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    /**
     * Fetch Available Rooms
     */
    async function fetchRooms() {
      try {
        const response = await api.getPublicRooms();
        setRooms(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ห้องว่าง</h1>

        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">ไม่มีห้องว่างในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2">
                    ห้อง {room.roomNumber}
                  </h2>
                  <p className="text-gray-600 mb-4">{room.building.name}</p>

                  <div className="space-y-2 mb-4">
                    <p className="text-lg font-bold text-primary-600">
                      ฿{room.monthlyRent.toLocaleString()}/เดือน
                    </p>
                    {room.areaSqm && (
                      <p className="text-sm text-gray-600">
                        พื้นที่: {room.areaSqm} ตร.ม.
                      </p>
                    )}
                    {room.deposit > 0 && (
                      <p className="text-sm text-gray-600">
                        เงินมัดจำ: ฿{room.deposit.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {room.description && (
                    <p className="text-sm text-gray-700 mb-4">{room.description}</p>
                  )}

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/rooms/${room.id}`}
                    className="block w-full text-center py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

