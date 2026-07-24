/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Plus, Search, Users, MapPin, Edit3, Trash2 } from 'lucide-react';
import { ShareListingForm } from './ShareListingForm';
import './OwnerListings.css'; // tái dùng style glass-card / badge / grid có sẵn
import { deleteShareListing, fetchMyShareListings } from './shareListing.api';
import { fetchActiveRentedContracts, spaceNameOf } from './contract.api';

export const SharedSpaceManagement: React.FC = () => {
  const [shareListings, setShareListings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);

  // TODO: gắn API thật lấy mặt bằng B đang thuê (hợp đồng active), tạm thời để rỗng
  const [spaceOptions, setSpaceOptions] = useState<{ id: number; name: string }[]>([]);
  const [apiCategories] = useState<{ id: number; name: string }[]>([]);
  const [apiAmenities] = useState<{ id: number; name: string }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyShareListings();
      setShareListings(data);
    } catch (err) {
      console.error('Lỗi lấy danh sách mặt bằng chia sẻ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  useEffect(() => {
  (async () => {
    const contracts = await fetchActiveRentedContracts();
    setSpaceOptions(contracts.map(c => ({ id: c.spaceId, name: spaceNameOf(c) })));
  })();
}, []);

  const filtered = shareListings.filter((l) => {
    const safeLocation = l?.location || l?.address || '';
    return safeLocation.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.listing-card');
      if (cards.length > 0) {
        gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [filtered.length]);

  const handleOpenNew = () => {
    setEditingListing(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (listing: any) => {
    setEditingListing(listing);
    setIsFormOpen(true);
  };

  const handleDelete = async (listing: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mặt bằng chia sẻ này?')) return;
    const targetId = listing.id || listing.Id;
    const ok = await deleteShareListing(targetId);
    if (ok) {
      setShareListings(prev => prev.filter(l => (l.id || l.Id) !== targetId));
    } else {
      alert('Không thể xóa. Vui lòng thử lại.');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    loadData();
  };

  return (
    <div className="owner-listings animate-in" ref={containerRef}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mặt bằng chia sẻ</h1>
          <p className="page-subtitle text-secondary">Quản lý các phần mặt bằng bạn đang chia sẻ lại cho người thuê khác</p>
        </div>
        <button className="btn-primary" onClick={handleOpenNew}>
          <Plus size={16} /> Chia sẻ mặt bằng
        </button>
      </div>

      <div className="listings-controls glass-card">
        <div className="listings-search">
          <Search size={15} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="listings-grid">
        {isLoading && filtered.length === 0 && <p className="text-secondary" style={{ padding: 20 }}>Đang tải dữ liệu...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-secondary" style={{ padding: 20 }}>Chưa có mặt bằng nào được chia sẻ.</p>
        )}
        {filtered.map((listing, index) => {
          const currentId = listing.id || listing.Id;
          return (
            <div key={currentId || index} className="glass-card listing-card">
              <div className="listing-card-top">
                <div className="listing-type-tag">
                  <Users size={13} />
                  Chia sẻ
                </div>
                {/* Badge trạng thái đặc thù cho share listing */}
                <span className="badge badge--warning">
                  Mặt bằng chia sẻ với người khác
                </span>
              </div>

              <div className="listing-card-body">
                <p className="listing-location">
                  <MapPin size={12} />
                  {listing.location || listing.address || 'Chưa cập nhật địa chỉ'}
                </p>

                <div className="listing-price-row">
                  <span className="listing-price">
                    {listing.price ? `${listing.price.toLocaleString('vi-VN')}₫` : 'Thỏa thuận'}
                  </span>
                  <span className="text-secondary" style={{ fontSize: 12 }}>/giờ</span>
                </div>

                <div className="listing-meta">
                  <div className="listing-meta-item">
                    <Users size={12} className="text-secondary" />
                    <span>Tối đa {listing.shareSpaceDetailMaxSubRenter || 1} người thuê chung</span>
                  </div>
                </div>

                {listing.shareSpaceDetailIsLegalCommitted && (
                  <div className="listing-meta-item" style={{ color: 'var(--color-positive)' }}>
                    <span>✓ Có cam kết pháp lý</span>
                  </div>
                )}
              </div>

              <div className="listing-card-actions">
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOpenEdit(listing)}>
                  <Edit3 size={14} /> Sửa
                </button>
                <button className="btn-icon" style={{ color: 'var(--color-negative)' }} onClick={() => handleDelete(listing)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <ShareListingForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          initialData={editingListing}
          spaceOptions={spaceOptions}
          apiCategories={apiCategories}
          apiAmenities={apiAmenities}
        />
      )}
    </div>
  );
};