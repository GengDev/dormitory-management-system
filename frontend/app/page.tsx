/**
 * Public Home Page
 *
 * หน้าแรกสำหรับผู้ที่สนใจเช่าหอพัก
 *
 * @module app/page
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Building {
  id: string;
  name: string;
  address: string;
  description: string;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  images: string[];
}

interface Room {
  id: string;
  roomNumber: string;
  floorNumber: number;
  roomType: string;
  monthlyRent: number;
  areaSqm: number;
  status: string;
  amenities: string[];
  building: {
    id: string;
    name: string;
    address: string;
  };
}

export default function HomePage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch buildings
      const buildingsResponse = await api.getPublicBuildings();
      setBuildings(buildingsResponse.data.data);

      // Fetch available rooms
      const roomsResponse = await api.getPublicRooms({ status: 'available', limit: 6 });
      setAvailableRooms(roomsResponse.data.data);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return '📶';
      case 'aircon':
        return '❄️';
      case 'parking':
        return '🚗';
      case 'gym':
        return '💪';
      case 'pool':
        return '🏊‍♂️';
      case 'kitchen':
        return '🍳';
      case 'balcony':
        return '🌅';
      case 'water_heater':
        return '🔥';
      case 'tv':
        return '📺';
      case 'fridge':
        return '🧊';
      default:
        return '✅';
    }
  };

  const getRoomTypeText = (type: string) => {
    switch (type) {
      case 'single':
        return 'ห้องเดี่ยว';
      case 'double':
        return 'ห้องคู่';
      case 'suite':
        return 'ห้องสวีท';
      case 'studio':
        return 'สตูดิโอ';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span className="font-bold text-xl text-primary-600">Dormitory System</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  หน้าแรก
                </Link>
                <a href="#buildings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  หอพัก
                </a>
                <Link href="/chat" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  ติดต่อเรา
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-700 font-medium text-sm hidden sm:block"
              >
                สำหรับเจ้าหน้าที่
              </Link>
              <Link
                href="/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-sm"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              หอพักคุณภาพ
              <br />
              <span className="text-primary-100">พร้อมอยู่</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              หอพักมาตรฐานสูง พร้อมสิ่งอำนวยความสะดวกครบครัน
              จัดการง่ายผ่านระบบออนไลน์ และบริการหลังการขายที่เป็นเลิศ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                💬 สอบถามข้อมูล
              </Link>
              <a
                href="#buildings"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                🏢 ดูหอพัก
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ทำไมต้องเลือกเรา?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เรามีความพร้อมในการให้บริการที่ครบครัน และใส่ใจในทุกความต้องการของผู้เช่า
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                จัดการผ่านแอพ
              </h3>
              <p className="text-gray-600">
                เช็คบิล ชำระเงิน แจ้งซ่อม และติดต่อทีมงานได้ทุกที่ทุกเวลา
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ความปลอดภัยสูง
              </h3>
              <p className="text-gray-600">
                ระบบรักษาความปลอดภัย 24 ชั่วโมง พร้อมกล้องวงจรปิด
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                บริการรวดเร็ว
              </h3>
              <p className="text-gray-600">
                ทีมงานมืออาชีพพร้อมให้บริการและแก้ไขปัญหาทันที
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Section */}
      <div id="buildings" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              อาคารหอพักของเรา
            </h2>
            <p className="text-lg text-gray-600">
              เลือกหอพักที่ตรงกับไลฟ์สไตล์ของคุณ
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
            </div>
          ) : buildings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ยังไม่มีข้อมูลหอพัก</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {buildings.map((building) => (
                <div key={building.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {building.images && building.images.length > 0 ? (
                      <img
                        src={building.images[0]}
                        alt={building.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl text-gray-400">🏢</span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {building.name}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      📍 {building.address}
                    </p>
                    <p className="text-gray-700 mb-4">
                      {building.description}
                    </p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">
                        ห้องทั้งหมด: {building.totalRooms}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        ว่าง: {building.availableRooms} ห้อง
                      </span>
                    </div>
                    {building.amenities && building.amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          สิ่งอำนวยความสะดวก:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {building.amenities.slice(0, 4).map((amenity) => (
                            <span
                              key={amenity}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                            >
                              {getAmenityIcon(amenity)} {amenity}
                            </span>
                          ))}
                          {building.amenities.length > 4 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              +{building.amenities.length - 4} อื่นๆ
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <Link
                      href="/chat"
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors inline-block text-center"
                    >
                      💬 สอบถามราคา
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Rooms Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ห้องว่างพร้อมเข้าอยู่
            </h2>
            <p className="text-lg text-gray-600">
              เลือกห้องที่ต้องการได้เลยวันนี้
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">กำลังโหลดข้อมูล...</div>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">ขณะนี้ไม่มีห้องว่าง</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableRooms.map((room) => (
                <div key={room.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        ห้อง {room.roomNumber}
                      </h3>
                      <p className="text-gray-600">
                        {room.building.name} • ชั้น {room.floorNumber}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ว่าง
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">ประเภท:</span> {getRoomTypeText(room.roomType)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">พื้นที่:</span> {room.areaSqm} ตร.ม.
                    </p>
                    <p className="text-2xl font-bold text-primary-600">
                      ฿{room.monthlyRent?.toLocaleString() || '0'}/เดือน
                    </p>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center text-sm text-gray-600"
                          >
                            {getAmenityIcon(amenity)}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="text-sm text-gray-500">
                            +{room.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    href="/chat"
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors inline-block text-center"
                  >
                    💬 สนใจห้องนี้
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            เริ่มต้นการเดินทางกับเรา
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            พร้อมที่จะหาหอพักในฝันของคุณแล้วหรือยัง?
            ติดต่อเราวันนี้เพื่อเริ่มการเดินทางครั้งใหม่
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              💬 แชทกับเรา
            </Link>
            <a
              href="tel:+66999999999"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              📞 โทร: 099-999-9999
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              หอพักคุณภาพ พร้อมให้บริการ
            </h3>
            <p className="text-gray-400 mb-4">
              จัดการง่าย ปลอดภัย และสะดวกสบาย
            </p>
            <p className="text-sm text-gray-500">
              © 2024 หอพักคุณภาพ. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
