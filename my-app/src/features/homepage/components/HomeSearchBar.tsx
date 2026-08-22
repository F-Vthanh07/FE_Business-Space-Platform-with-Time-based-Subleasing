// src/features/homepage/components/HomeSearchBar.tsx
import React, { useState, useEffect } from 'react';
import { Search, MapPin, RotateCcw, X } from 'lucide-react';

export interface FeedFilterState {
  searchQuery: string;
  provinceCode: string;
  provinceLabel: string;
  districtCode: string;
  districtLabel: string;
  priceRange: string;
  minPrice: string;
  maxPrice: string;
  areaRange: string;
  minArea: string;
  maxArea: string;
  categoryId: string;
  categoryLabel: string;
}

interface HomeSearchBarProps {
  filters?: FeedFilterState;
  onFilterChange?: (updatedFilters: Partial<FeedFilterState>) => void;
  onResetFilters?: () => void;
  categories?: { value: string; label: string }[];
}

const DEFAULT_FILTERS: FeedFilterState = {
  searchQuery: '',
  provinceCode: '',
  provinceLabel: '',
  districtCode: '',
  districtLabel: '',
  priceRange: 'all',
  minPrice: '',
  maxPrice: '',
  areaRange: 'all',
  minArea: '',
  maxArea: '',
  categoryId: '',
  categoryLabel: '',
};

export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
  filters = DEFAULT_FILTERS,
  onFilterChange,
  onResetFilters,
  categories = [],
}) => {
  const currentFilters = filters || DEFAULT_FILTERS;
  const [provinces, setProvinces] = useState<{ value: string; label: string }[]>([]);
  const [districts, setDistricts] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  // Lấy danh sách Tỉnh/Thành phố từ API
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAddress', {
          headers: { accept: '*/*' },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.data || data?.Data || data?.items || []);
          setProvinces(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách Tỉnh/Thành phố:', err);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Lấy danh sách Quận/Huyện từ API dựa theo provinceCode
  useEffect(() => {
    if (!currentFilters.provinceCode) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const res = await fetch(
          `https://flexi-space-capstone-project.onrender.com/api/Space/GetAddress?provinceCode=${encodeURIComponent(
            currentFilters.provinceCode
          )}`,
          { headers: { accept: '*/*' } }
        );
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data?.data || data?.Data || data?.items || []);
          setDistricts(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách Quận/Huyện:', err);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [currentFilters.provinceCode]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange?.({ searchQuery: e.target.value });
  };

  const handleProvinceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = provinces.find((p) => p.value === value)?.label || '';
    onFilterChange?.({
      provinceCode: value,
      provinceLabel: label,
      districtCode: '',
      districtLabel: '',
    });
  };

  const handleDistrictSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = districts.find((d) => d.value === value)?.label || '';
    onFilterChange?.({
      districtCode: value,
      districtLabel: label,
    });
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = categories.find((c) => c.value === value)?.label || '';
    onFilterChange?.({
      categoryId: value,
      categoryLabel: label,
    });
  };

  const activeFiltersCount = [
    currentFilters.searchQuery,
    currentFilters.provinceCode,
    currentFilters.districtCode,
    currentFilters.priceRange !== 'all' ? currentFilters.priceRange : '',
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.areaRange !== 'all' ? currentFilters.areaRange : '',
    currentFilters.minArea,
    currentFilters.maxArea,
    currentFilters.categoryId,
  ].filter(Boolean).length;

  return (
    <div className="home-search-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Ô NHẬP TÌM KIẾM TỪ KHÓA */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search
          size={18}
          color="#65676B"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
        />
        <input
          type="text"
          value={currentFilters.searchQuery || ''}
          onChange={handleSearchChange}
          placeholder="Nhập tên mặt bằng, từ khóa, người đăng, địa chỉ..."
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: '8px',
            border: '1px solid #CED0D4',
            backgroundColor: '#F0F2F5',
            fontSize: '14px',
            color: '#050505',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.borderColor = 'var(--color-primary, #3b82f6)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = '#F0F2F5';
            e.currentTarget.style.borderColor = '#CED0D4';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {currentFilters.searchQuery && (
          <button
            onClick={() => onFilterChange?.({ searchQuery: '' })}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#65676B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* THANH BỘ LỌC VỚI DROPDOWN TỈNH/THÀNH VÀ CÁC THÔNG SỐ */}
      <div className="hs-filter-bar" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* DROPDOWN TỈNH / THÀNH PHỐ (lấy từ api/Space/GetAddress) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
          <select
            className="hs-select-box"
            value={currentFilters.provinceCode || ''}
            onChange={handleProvinceSelect}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: currentFilters.provinceCode ? '1px solid var(--color-primary, #3b82f6)' : '1px solid #E5E7EB',
              backgroundColor: currentFilters.provinceCode ? 'rgba(59,130,246,0.06)' : '#fff',
              fontWeight: currentFilters.provinceCode ? 600 : 400,
              fontSize: '14px',
              color: '#050505',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">{isLoadingProvinces ? 'Đang tải Tỉnh/Thành...' : '📍 Tất cả Tỉnh/Thành'}</option>
            {Array.isArray(provinces) && provinces.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* DROPDOWN QUẬN / HUYỆN (lấy từ api/Space/GetAddress?provinceCode=...) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <select
            className="hs-select-box"
            value={currentFilters.districtCode || ''}
            onChange={handleDistrictSelect}
            disabled={!currentFilters.provinceCode}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: currentFilters.districtCode ? '1px solid var(--color-primary, #3b82f6)' : '1px solid #E5E7EB',
              backgroundColor: currentFilters.districtCode ? 'rgba(59,130,246,0.06)' : '#fff',
              fontWeight: currentFilters.districtCode ? 600 : 400,
              fontSize: '14px',
              color: !currentFilters.provinceCode ? '#9CA3AF' : '#050505',
              cursor: !currentFilters.provinceCode ? 'not-allowed' : 'pointer',
              outline: 'none',
            }}
          >
            <option value="">
              {!currentFilters.provinceCode
                ? '🏘️ Chọn Tỉnh/Thành trước'
                : isLoadingDistricts
                ? 'Đang tải Quận/Huyện...'
                : '🏘️ Tất cả Quận/Huyện'}
            </option>
            {Array.isArray(districts) && districts.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* KHOẢNG GIÁ */}
        <select
          className="hs-select-box"
          value={currentFilters.priceRange || 'all'}
          onChange={(e) => onFilterChange?.({ priceRange: e.target.value })}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: currentFilters.priceRange !== 'all' ? '1px solid var(--color-primary, #3b82f6)' : '1px solid #E5E7EB',
            backgroundColor: currentFilters.priceRange !== 'all' ? 'rgba(59,130,246,0.06)' : '#fff',
            fontWeight: currentFilters.priceRange !== 'all' ? 600 : 400,
            fontSize: '14px',
            color: '#050505',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">💰 Khoảng giá</option>
          <option value="under5">Dưới 5 triệu</option>
          <option value="5-15">5 - 15 triệu</option>
          <option value="15-30">15 - 30 triệu</option>
          <option value="over30">Trên 30 triệu</option>
        </select>

        {/* DIỆN TÍCH */}
        <select
          className="hs-select-box"
          value={currentFilters.areaRange || 'all'}
          onChange={(e) => onFilterChange?.({ areaRange: e.target.value })}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: currentFilters.areaRange !== 'all' ? '1px solid var(--color-primary, #3b82f6)' : '1px solid #E5E7EB',
            backgroundColor: currentFilters.areaRange !== 'all' ? 'rgba(59,130,246,0.06)' : '#fff',
            fontWeight: currentFilters.areaRange !== 'all' ? 600 : 400,
            fontSize: '14px',
            color: '#050505',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">📐 Diện tích</option>
          <option value="under30">Dưới 30 m²</option>
          <option value="30-70">30 - 70 m²</option>
          <option value="70-150">70 - 150 m²</option>
          <option value="over150">Trên 150 m²</option>
        </select>

        {/* NGÀNH NGHỀ ĐƯỢC PHÉP KINH DOANH */}
        <select
          className="hs-select-box"
          value={currentFilters.categoryId || ''}
          onChange={handleCategorySelect}
          disabled={categories.length === 0}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: currentFilters.categoryId ? '1px solid var(--color-primary, #3b82f6)' : '1px solid #E5E7EB',
            backgroundColor: currentFilters.categoryId ? 'rgba(59,130,246,0.06)' : '#fff',
            fontWeight: currentFilters.categoryId ? 600 : 400,
            fontSize: '14px',
            color: categories.length === 0 ? '#9CA3AF' : '#050505',
            cursor: categories.length === 0 ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
        >
          <option value="">🏷️ Ngành nghề</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* NÚT XÓA BỘ LỌC */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #E02424',
              backgroundColor: '#FDF2F2',
              color: '#E02424',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            <RotateCcw size={13} /> Xóa bộ lọc ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* DẢI TAG ĐỊA ĐIỂM CHỌN NHANH */}
      <div className="hs-breadcrumb-bar" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #E5E7EB' }}>
        <span className="hs-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#65676B' }}>
          <MapPin size={13} /> Gợi ý khu vực:
        </span>
        <div className="hs-pills-list" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['Hồ Chí Minh', 'Hà Nội', 'Quận 1', 'Quận 7', 'Bình Thạnh', 'Quận 2', 'Thủ Đức'].map((location) => {
            const isSelected =
              currentFilters.searchQuery === location ||
              Boolean(currentFilters.provinceLabel?.includes(location)) ||
              Boolean(currentFilters.districtLabel?.includes(location));

            return (
              <button
                key={location}
                type="button"
                className="hs-pill"
                onClick={() => {
                  if (isSelected) {
                    onFilterChange?.({ searchQuery: '', provinceCode: '', provinceLabel: '', districtCode: '', districtLabel: '' });
                  } else {
                    onFilterChange?.({ searchQuery: location });
                  }
                }}
                style={{
                  backgroundColor: isSelected ? 'var(--color-primary, #3b82f6)' : '#F0F2F5',
                  color: isSelected ? '#fff' : '#050505',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '12px',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {location}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};