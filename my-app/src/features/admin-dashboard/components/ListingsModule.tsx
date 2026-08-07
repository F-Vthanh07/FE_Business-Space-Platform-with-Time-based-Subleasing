import React, { useState, useEffect } from 'react';
import { Check, X, MapPin, Clock, Eye, Building2, Users, ChevronLeft, ChevronRight, Flag, Trash2, RotateCcw, Archive } from 'lucide-react';
import type { AdminListingItem, BusinessCategory, ListingReportItem, ListingReportDetail } from '../types';
import { ListingDetailModal } from './ListingDetailModal';
import { getPictureUrl } from '../utils/listingPicture';
import { fetchListingReportDetail } from '../api/admin.api';

export const REPORT_REASON_LABELS: Record<string, { en: string; vi: string }> = {
  ScamOrFraud: { en: 'Scam / Fraud', vi: 'Lừa đảo / Gian lận' },
  FakeInformation: { en: 'Fake information', vi: 'Thông tin giả mạo' },
  PriceMismatch: { en: 'Price mismatch', vi: 'Giá không đúng thực tế' },
  FakeAddress: { en: 'Fake address', vi: 'Địa chỉ không chính xác' },
  InappropriateContent: { en: 'Inappropriate content', vi: 'Nội dung không phù hợp' },
  WrongCategory: { en: 'Wrong category', vi: 'Sai danh mục' },
  Other: { en: 'Other', vi: 'Lý do khác' },
};

export const getReasonLabel = (reason: string, language: 'en' | 'vi') =>
  REPORT_REASON_LABELS[reason]?.[language] || reason;

type DeletedListingType = 'EntireSpace' | 'SharedSpace';

interface ListingsModuleProps {
  listings: AdminListingItem[];
  handleApproveListing: (listingId: number) => void;
  handleRejectListing: (listingId: number, reason: string) => void;
  isLoading: boolean;
  language: 'en' | 'vi';
  categories: BusinessCategory[];
  reports: ListingReportItem[];
  handleDeleteReportedListing: (listingId: number) => void;
  deletedListings: AdminListingItem[];
  deletedListingType: DeletedListingType;
  onChangeDeletedListingType: (type: DeletedListingType) => void;
  isLoadingDeleted: boolean;
  handleRestoreListing: (listingId: number) => void;
}

type ListingsTab = 'all' | 'reports' | 'deleted';

const statusConfig: Record<string, { className: string; label: { en: string; vi: string } }> = {
  pending: { className: 'badge--warning', label: { en: 'Pending', vi: 'Chờ duyệt' } },
  accepted: { className: 'badge--positive', label: { en: 'Accepted', vi: 'Đã duyệt' } },
  canceled: { className: 'badge--negative', label: { en: 'Canceled', vi: 'Từ chối' } },
};

const isShareListing = (l: AdminListingItem) => l?.listingType === 'SharedSpace';

const ITEMS_PER_PAGE = 8; // 2 hàng x 4 cột

const ListingCoverImage: React.FC<{ src: string }> = ({ src }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return <Building2 size={32} style={{ color: 'var(--color-positive)', opacity: 0.4 }} />;
  }

  return (
    <img
      src={src}
      alt="cover"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setHasError(true)}
    />
  );
};

export const ListingsModule: React.FC<ListingsModuleProps> = ({
  listings,
  handleApproveListing,
  handleRejectListing,
  isLoading,
  language,
  categories,
  reports,
  handleDeleteReportedListing,
  deletedListings,
  deletedListingType,
  onChangeDeletedListingType,
  isLoadingDeleted,
  handleRestoreListing,
}) => {
  const [activeListingsTab, setActiveListingsTab] = useState<ListingsTab>('all');
  const [selectedListing, setSelectedListing] = useState<AdminListingItem | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<number | null>(null);
  const [reportDetails, setReportDetails] = useState<Record<number, ListingReportDetail>>({});
  const [loadingReportDetailId, setLoadingReportDetailId] = useState<number | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [selectedListingReportDetail, setSelectedListingReportDetail] = useState<ListingReportDetail | null>(null);

  const token = localStorage.getItem('portal_token');

  const loadReportDetail = async (listingId: number): Promise<ListingReportDetail | null> => {
    if (reportDetails[listingId]) return reportDetails[listingId];
    if (!token) return null;
    setLoadingReportDetailId(listingId);
    try {
      const detail = await fetchListingReportDetail(listingId, token);
      setReportDetails(prev => ({ ...prev, [listingId]: detail }));
      return detail;
    } catch (e) {
      console.warn('Không tải được lý do báo cáo cho tin đăng', listingId, e);
      return null;
    } finally {
      setLoadingReportDetailId(null);
    }
  };

  const handleToggleReportReasons = async (listingId: number) => {
    if (expandedReportId === listingId) {
      setExpandedReportId(null);
      return;
    }
    setExpandedReportId(listingId);
    await loadReportDetail(listingId);
  };

  const handleViewReportedListing = async (listingId: number) => {
    const found = listings.find(l => l.id === listingId);
    if (found) {
      setSelectedListing(found);
      setSelectedListingReportDetail(null);
      const detail = await loadReportDetail(listingId);
      setSelectedListingReportDetail(detail);
    } else {
      alert(language === 'en' ? 'Listing details are not loaded yet.' : 'Chưa tải được chi tiết tin đăng này.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(listings.length / ITEMS_PER_PAGE));
  const pagedListings = listings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [listings.length]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return language === 'en' ? 'Unknown' : 'Không rõ';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
  };

  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Listings Verification' : 'Phê duyệt Tin đăng'}</h1>
        <p>{language === 'en' ? 'Review lease and time-sharing offers before publishing' : 'Kiểm tra và duyệt các gói tin đăng cho thuê trước khi công khai lên sàn giao dịch'}</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`btn-ghost ${activeListingsTab === 'all' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveListingsTab('all')}
        >
          {language === 'en' ? 'All Listings' : 'Tất cả tin đăng'}
        </button>
        <button
          className={`btn-ghost ${activeListingsTab === 'reports' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveListingsTab('reports')}
        >
          <Flag size={14} />
          {language === 'en' ? 'Reported Listings' : 'Tin đăng bị báo cáo'}
          {reports.length > 0 && <span className="badge badge--negative" style={{ marginLeft: '4px' }}>{reports.length}</span>}
        </button>
        <button
          className={`btn-ghost ${activeListingsTab === 'deleted' ? 'admin-tab--active' : ''}`}
          onClick={() => setActiveListingsTab('deleted')}
        >
          <Archive size={14} />
          {language === 'en' ? 'Deleted Listings' : 'Tin đăng đã xóa'}
        </button>
      </div>

      {activeListingsTab === 'reports' && (
        <div className="admin-table-container glass-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{language === 'en' ? 'Description' : 'Mô tả'}</th>
                <th style={{ textAlign: 'center' }}>{language === 'en' ? 'Reports' : 'Số lượt báo cáo'}</th>
                <th>{language === 'en' ? 'Reasons' : 'Lý do báo cáo'}</th>
                <th>{language === 'en' ? 'Status' : 'Trạng thái'}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                    {language === 'en' ? 'No reported listings.' : 'Không có tin đăng nào bị báo cáo.'}
                  </td>
                </tr>
              ) : (
                reports.map(r => {
                  const cleanStatus = (r.listingStatus || 'Pending').toLowerCase();
                  const status = statusConfig[cleanStatus] || statusConfig.pending;
                  const isExpanded = expandedReportId === r.listingId;
                  const detail = reportDetails[r.listingId];
                  return (
                    <React.Fragment key={r.listingId}>
                    <tr className={r.isBanned ? 'blocked-row' : ''}>
                      <td className="font-mono">{r.listingId}</td>
                      <td>
                        {r.listingDescription && r.listingDescription.length > 80
                          ? `${r.listingDescription.substring(0, 80)}...`
                          : r.listingDescription || (language === 'en' ? 'No description' : 'Không có mô tả')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong className="text-negative">{r.reportCount}</strong>
                      </td>
                      <td>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={() => handleToggleReportReasons(r.listingId)}
                        >
                          <Flag size={12} />
                          {isExpanded
                            ? (language === 'en' ? 'Hide reasons' : 'Ẩn lý do')
                            : (language === 'en' ? 'Show reasons' : 'Xem lý do')}
                        </button>
                      </td>
                      <td>
                        <span className={`badge ${status.className}`}>{status.label[language]}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn-action-icon unblock"
                            onClick={() => handleViewReportedListing(r.listingId)}
                            title={language === 'en' ? 'View details' : 'Xem chi tiết'}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn-action-icon block"
                            onClick={() => setDeletingReportId(r.listingId)}
                            title={language === 'en' ? 'Delete listing' : 'Xóa tin đăng'}
                            disabled={isLoading}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={r.isBanned ? 'blocked-row' : ''}>
                        <td colSpan={6} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)' }}>
                          {loadingReportDetailId === r.listingId ? (
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              {language === 'en' ? 'Loading reasons...' : 'Đang tải lý do báo cáo...'}
                            </span>
                          ) : detail && detail.reasonBreakdown.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {detail.reasonBreakdown.map(rb => (
                                <span key={rb.reason} className="badge badge--negative" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <Flag size={11} />
                                  {getReasonLabel(rb.reason, language)}
                                  <strong>× {rb.count}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              {language === 'en' ? 'No reason data available.' : 'Không có dữ liệu lý do báo cáo.'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeListingsTab === 'deleted' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className={`btn-ghost ${deletedListingType === 'EntireSpace' ? 'admin-tab--active' : ''}`}
              onClick={() => onChangeDeletedListingType('EntireSpace')}
            >
              {language === 'en' ? 'Entire Space' : 'Toàn bộ mặt bằng'}
            </button>
            <button
              className={`btn-ghost ${deletedListingType === 'SharedSpace' ? 'admin-tab--active' : ''}`}
              onClick={() => onChangeDeletedListingType('SharedSpace')}
            >
              {language === 'en' ? 'Shared Space' : 'Chia sẻ mặt bằng'}
            </button>
          </div>

          <div className="admin-table-container glass-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{language === 'en' ? 'Description' : 'Mô tả'}</th>
                  <th>{language === 'en' ? 'Address' : 'Địa chỉ'}</th>
                  <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Price' : 'Giá'}</th>
                  <th>{language === 'en' ? 'Status' : 'Trạng thái'}</th>
                  <th>{language === 'en' ? 'Deleted At' : 'Ngày xóa'}</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDeleted ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                      {language === 'en' ? 'Loading...' : 'Đang tải...'}
                    </td>
                  </tr>
                ) : deletedListings.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                      {language === 'en' ? 'No deleted listings.' : 'Không có tin đăng nào bị xóa.'}
                    </td>
                  </tr>
                ) : (
                  deletedListings.map(lt => {
                    const cleanStatus = (lt.status || 'Pending').toLowerCase();
                    const status = statusConfig[cleanStatus] || statusConfig.pending;
                    return (
                      <tr key={lt.id} className="blocked-row">
                        <td className="font-mono">{lt.id}</td>
                        <td>
                          {lt.description && lt.description.length > 80
                            ? `${lt.description.substring(0, 80)}...`
                            : lt.description || (language === 'en' ? 'No description' : 'Không có mô tả')}
                        </td>
                        <td>{lt.spaceAddress || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {lt.price ? `${lt.price.toLocaleString('vi-VN')}₫` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>{status.label[language]}</span>
                        </td>
                        <td className="font-mono">{formatDate(lt.updatedAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              className="btn-action-icon unblock"
                              onClick={() => handleViewReportedListing(lt.id)}
                              title={language === 'en' ? 'View details' : 'Xem chi tiết'}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn-action-icon unblock"
                              onClick={() => handleRestoreListing(lt.id)}
                              title={language === 'en' ? 'Restore' : 'Khôi phục'}
                              disabled={isLoading}
                            >
                              <RotateCcw size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Listings Grid */}
      {activeListingsTab === 'all' && (
      <div className="listings-grid">
        {listings.length === 0 ? (
          <div className="empty-approval glass-card">
            <Check size={36} className="text-neon-green" />
            <h3>{language === 'en' ? 'No listings found' : 'Không tìm thấy bài đăng nào'}</h3>
            <p>{language === 'en' ? 'New listings will appear here' : 'Bài đăng mới sẽ xuất hiện tại đây'}</p>
          </div>
        ) : (
          pagedListings.map(lt => {
            const cleanStatus = (lt.status || 'Pending').toLowerCase();
            const isPending = cleanStatus === 'pending';
            const coverUrl = lt.listingPictures && lt.listingPictures.length > 0 ? getPictureUrl(lt.listingPictures[0]) : null;
            const status = statusConfig[cleanStatus] || statusConfig.pending;
            const categoryName = lt.shareSpaceDetailShareSpaceCategories && lt.shareSpaceDetailShareSpaceCategories.length > 0
              ? categories.find(c => c.id === lt.shareSpaceDetailShareSpaceCategories![0].bussinessCategoryId)?.name
              : undefined;

            return (
              <div key={lt.id} className="glass-card listing-card">
                <div className="listing-card-top">
                  <div className="listing-type-tag">
                    {isShareListing(lt) ? <Users size={13} /> : <Building2 size={13} />}
                    {isShareListing(lt) ? (language === 'en' ? 'Shared' : 'Chia sẻ') : (language === 'en' ? 'Long-term' : 'Dài hạn')}
                  </div>
                  <span className={`badge ${status.className}`}>
                    {status.label[language]}
                  </span>
                </div>

                <div className="listing-visual">
                  {coverUrl ? (
                    <ListingCoverImage src={coverUrl} />
                  ) : (
                    <Building2 size={32} style={{ color: 'var(--color-positive)', opacity: 0.4 }} />
                  )}
                </div>

                <div className="listing-card-body">
                  <p className="listing-location">
                    <MapPin size={12} />
                    {lt.spaceAddress || (language === 'en' ? 'Not updated' : 'Chưa cập nhật')}
                  </p>

                  <p className="listing-name" style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {lt.description && lt.description.length > 90
                      ? `${lt.description.substring(0, 90)}...`
                      : lt.description || (language === 'en' ? 'Rental Listing' : 'Bài đăng cho thuê')}
                  </p>

                  <div className="listing-price-row">
                    <span className="listing-price">
                      {lt.price ? `${lt.price.toLocaleString('vi-VN')}₫` : (language === 'en' ? 'Negotiable' : 'Thỏa thuận')}
                    </span>
                    <span className="text-secondary" style={{ fontSize: 12 }}>/{language === 'en' ? 'hour' : 'giờ'}</span>
                  </div>

                  <div className="listing-meta">
                    <div className="listing-meta-item">
                      <Clock size={12} className="text-secondary" />
                      <span>{formatDate(lt.createdAt)}</span>
                    </div>
                    {lt.shareSpaceDetailMaxSubRenter !== undefined && (
                      <div className="listing-meta-item">
                        <Users size={12} className="text-secondary" />
                        <span>{language === 'en' ? 'Max' : 'Tối đa'} {lt.shareSpaceDetailMaxSubRenter}</span>
                      </div>
                    )}
                    {categoryName && (
                      <div className="listing-meta-item">
                        <span>{categoryName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="listing-card-actions">
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleViewReportedListing(lt.id)}
                  >
                    <Eye size={14} /> {language === 'en' ? 'View' : 'Xem'}
                  </button>

                  {isPending && (
                    <>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--color-positive)' }}
                        disabled={isLoading}
                        title={language === 'en' ? 'Approve' : 'Duyệt'}
                        onClick={() => handleApproveListing(lt.id)}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--color-negative)' }}
                        disabled={isLoading}
                        title={language === 'en' ? 'Reject' : 'Từ chối'}
                        onClick={() => {
                          setRejectingId(lt.id);
                          setCancelReason('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--color-negative)' }}
                    disabled={isLoading}
                    title={language === 'en' ? 'Delete' : 'Xóa'}
                    onClick={() => setDeletingListingId(lt.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Pagination */}
      {activeListingsTab === 'all' && listings.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="btn-icon"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            title={language === 'en' ? 'Previous' : 'Trang trước'}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`admin-pagination-page ${page === currentPage ? 'admin-pagination-page--active' : ''}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="btn-icon"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            title={language === 'en' ? 'Next' : 'Trang sau'}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Details Modal Overlay */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => { setSelectedListing(null); setSelectedListingReportDetail(null); }}
          language={language}
          categories={categories}
          reportDetail={selectedListingReportDetail}
          isLoadingReportDetail={loadingReportDetailId === selectedListing.id}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectingId !== null && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="listing-form-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {language === 'en' ? 'Reason for Rejection' : 'Lý do từ chối bài đăng'}
              </h3>
              <button
                className="close-btn"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                onClick={() => setRejectingId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {language === 'en'
                  ? 'Please provide a clear reason for rejecting this listing. This will be sent to the space poster.'
                  : 'Vui lòng cung cấp lý do từ chối rõ ràng. Lý do này sẽ được gửi đến người đăng tin.'}
              </p>
              <textarea
                className="slot-input-text"
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '10px',
                  borderRadius: '6px',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                placeholder={language === 'en' ? 'Enter rejection reason...' : 'Nhập lý do từ chối...'}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setRejectingId(null)}
              >
                {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                className="btn-reject"
                style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}
                disabled={!cancelReason.trim()}
                onClick={() => {
                  if (cancelReason.trim()) {
                    handleRejectListing(rejectingId, cancelReason);
                    setRejectingId(null);
                  }
                }}
              >
                {language === 'en' ? 'Confirm' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reported Listing Confirmation */}
      {deletingReportId !== null && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="listing-form-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {language === 'en' ? 'Delete Reported Listing' : 'Xóa tin đăng vi phạm'}
              </h3>
              <button
                className="close-btn"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                onClick={() => setDeletingReportId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '14px' }}>
              {language === 'en'
                ? 'This listing will be removed from the platform. This action cannot be undone.'
                : 'Tin đăng này sẽ bị gỡ khỏi hệ thống. Hành động này không thể hoàn tác.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setDeletingReportId(null)}
              >
                {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                className="btn-reject"
                style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}
                disabled={isLoading}
                onClick={() => {
                  handleDeleteReportedListing(deletingReportId);
                  setDeletingReportId(null);
                }}
              >
                {language === 'en' ? 'Delete' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Listing Confirmation (All Listings tab) */}
      {deletingListingId !== null && (
        <div className="listing-detail-backdrop">
          <div className="listing-form-modal glass-card" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="listing-form-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                {language === 'en' ? 'Delete Listing' : 'Xóa tin đăng'}
              </h3>
              <button
                className="close-btn"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                onClick={() => setDeletingListingId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '14px' }}>
              {language === 'en'
                ? 'This listing will be removed from the platform. This action cannot be undone.'
                : 'Tin đăng này sẽ bị gỡ khỏi hệ thống. Hành động này không thể hoàn tác.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setDeletingListingId(null)}
              >
                {language === 'en' ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                className="btn-reject"
                style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}
                disabled={isLoading}
                onClick={() => {
                  handleDeleteReportedListing(deletingListingId);
                  setDeletingListingId(null);
                }}
              >
                {language === 'en' ? 'Delete' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
