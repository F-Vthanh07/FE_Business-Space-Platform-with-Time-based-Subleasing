/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Printer, Briefcase, Wallet, CalendarDays, Edit3, FileText, Building2, MapPin, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import {
  CONTRACT_TEMPLATES,
  getTemplateById,
  fillContractTemplate,
  renderMergeValue,
  formatSchedule,
  type ContractMergeData,
  type ContractSchedule,
  splitContractHeaderBody,
} from '../contractTemplates';
import { Toast, useToast } from '../Toast';
import { useConfirm } from '../ConfirmModal';

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChat: any;
  token: string | null;
  // Gọi khi tạo + share hợp đồng thành công (hoặc cập nhật thành công), để component cha gửi tin nhắn vào chat
  onCreated: (chatMessage: string) => Promise<void> | void;
  // Nếu có giá trị -> modal chạy ở chế độ SỬA hợp đồng đã tồn tại
  existingContract?: any;
}

interface UserProfile {
  userId: string;
  fullName: string;
  citizenIDNumber: string;
  dateOfIssue: string; // "2022-01-09"
}

const API_BASE = 'https://flexi-space-capstone-project.onrender.com';

// Danh sách các ngày trong tuần dùng để hiển thị checkbox chọn lịch hoạt động.
// value khớp với DayOfWeek mà backend mong đợi ('Monday'...'Sunday').
const DAYS_OF_WEEK: { value: number; stringValue: string; label: string }[] = [
  { value: 1, stringValue: 'Monday', label: 'Thứ 2' },
  { value: 2, stringValue: 'Tuesday', label: 'Thứ 3' },
  { value: 3, stringValue: 'Wednesday', label: 'Thứ 4' },
  { value: 4, stringValue: 'Thursday', label: 'Thứ 5' },
  { value: 5, stringValue: 'Friday', label: 'Thứ 6' },
  { value: 6, stringValue: 'Saturday', label: 'Thứ 7' },
  { value: 0, stringValue: 'Sunday', label: 'Chủ Nhật' },
];

// Đơn vị thời hạn hợp đồng - PHẢI khớp đủ 4 giá trị với enum numeric của
// Snapshot bên ContractViewModal (0=Days,1=Weeks,2=Months,3=Years). Trước đây
// form chỉ có 3 option (thiếu Weeks) nên khi chọn "Tuần" ở nơi khác (hoặc BE
// trả về Weeks) sẽ không hiển thị đúng.
const DURATION_UNITS: { value: string; label: string }[] = [
  { value: 'Days', label: 'Ngày' },
  { value: 'Weeks', label: 'Tuần' },
  { value: 'Months', label: 'Tháng' },
  { value: 'Years', label: 'Năm' },
];

// Nhãn thứ trong tuần cho OperatingHour.dayOfWeek (0=Chủ Nhật ... 6=Thứ 7, theo .NET DayOfWeek)
const OPERATING_DAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const ContractCreateModal: React.FC<ContractCreateModalProps> = ({
  isOpen,
  onClose,
  activeChat,
  token,
  onCreated,
  existingContract,
}) => {
  void onCreated;
  const { toast, showToast } = useToast();
  const { confirm, confirmModal } = useConfirm();
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [matchedBookingRequests, setMatchedBookingRequests] = useState<any[]>([]);
  const [isLoadingBookingRequests, setIsLoadingBookingRequests] = useState(false);
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [lessorProfile, setLessorProfile] = useState<UserProfile | null>(null);
  const [lesseeProfile, setLesseeProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  // Nhớ chuỗi đã render lần trước cho từng field (vd DIEN_TICH -> "90 m2")
  // để lần sau dữ liệu đổi, chỉ cần tìm đúng chuỗi cũ đó trong nội dung và
  // thay bằng chuỗi mới -> không đụng tới các phần bạn đã tự sửa tay.
  // Nếu bạn xóa hẳn đoạn đó đi, chuỗi cũ không còn -> hệ thống không tự chèn lại.
  const lastRenderedRef = React.useRef<Record<string, string>>({});

  const isEditMode = !!existingContract?.id;

  const [contractData, setContractData] = useState<{
    spaceId: string;
    primaryBookingRequestId: number;
    durationUnit: string;
    duration: number;
    startDate: string;
    acreage: number;
    price: number;
    depositAmount: number;
    description: string;
    businessPurpose: string;
    contractSchedules: ContractSchedule[];
  }>({
    spaceId: '',
    primaryBookingRequestId: 0,
    durationUnit: 'Days',
    duration: 1,
    startDate: new Date().toISOString().split('T')[0],
    acreage: 0,
    price: 0,
    depositAmount: 0,
    description: '',
    businessPurpose: '',
    // Để trống mặc định — không phải hợp đồng nào cũng có lịch hoạt động
    // cố định trong tuần, người dùng tick ngày nào cần thì thêm ngày đó.
    contractSchedules: [],
  });

  const [isSpaceDetailOpen, setIsSpaceDetailOpen] = useState(false);
  const [isBookingReqDropdownOpen, setIsBookingReqDropdownOpen] = useState(false);
  const [hoveredBookingReqId, setHoveredBookingReqId] = useState<number | null>(null);
  const bookingReqDropdownRef = React.useRef<HTMLDivElement>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [canShareSpace, setCanShareSpace] = useState(false);
  const [canShowShareCheckbox, setCanShowShareCheckbox] = useState(false);
  // Text hiển thị riêng cho ô Diện tích để người dùng gõ được dấu phẩy thập phân (VD: 123,00)
  // trong lúc gõ, tách biệt với contractData.acreage (number thật gửi lên API).
  const [acreageText, setAcreageText] = useState('0');

  const lessorId = activeChat?.lessorId || activeChat?.LessorId;
  const lesseeId = activeChat?.lesseeId || activeChat?.LesseeId;

  // Reset / Prefill khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    if (existingContract) {
      // --- CHẾ ĐỘ SỬA: nạp toàn bộ dữ liệu cũ vào form ---
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateId(''); // không chọn template để tránh auto-diff ghi đè mô tả đã có
      lastRenderedRef.current = {};
      setContractData({
        spaceId: existingContract.spaceId ? String(existingContract.spaceId) : '',
        primaryBookingRequestId: existingContract.primaryBookingRequestId || 0,
        durationUnit: existingContract.durationUnit || 'Days',
        duration: existingContract.duration || 1,
        startDate: existingContract.startDate
          ? new Date(existingContract.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        acreage: existingContract.acreage || 0,
        price: existingContract.price || 0,
        depositAmount: existingContract.depositAmount || 0,
        description: existingContract.description || '',
        businessPurpose: existingContract.businessPurpose || '',
        contractSchedules:
          existingContract.contractSchedules && existingContract.contractSchedules.length > 0
            ? existingContract.contractSchedules
            : [],
      });
      setAcreageText(String(existingContract.acreage ?? 0).replace('.', ','));
      setCanShareSpace(existingContract.canShare || false);
    } else {
      // --- CHẾ ĐỘ TẠO MỚI: reset trắng như cũ ---
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateId('');
      lastRenderedRef.current = {};
      setContractData((prev) => ({
        ...prev,
        spaceId: '',
        primaryBookingRequestId: 0,
        duration: 1,
        startDate: new Date().toISOString().split('T')[0],
        acreage: 0,
        price: 0,
        depositAmount: 0,
        description: '',
        businessPurpose: '',
        contractSchedules: [],
      }));
      setAcreageText('0');
      setCanShareSpace(false);
    }
  }, [isOpen, existingContract, activeChat?.id, activeChat?.conversationId]);

  // Lấy danh sách mặt bằng của chủ nhà
  useEffect(() => {
    if (!isOpen || !token) return;
    const currentUserId = localStorage.getItem('current_user_id');
    const fetchMySpaces = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/Space/GetAll?OwnerId=${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        let ownerSpaces: any[] = [];
        if (res.ok) {
          const data = await res.json();
          ownerSpaces = Array.isArray(data) ? data : data?.data || data?.items || [];
        }

        const resUsage = await fetch(`${API_BASE}/api/SpaceUsageRight/Mine`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        let usageSpaces: any[] = [];
        if (resUsage.ok) {
            const usageData = await resUsage.json();
            const rights = Array.isArray(usageData) ? usageData : usageData?.data || [];
            const shareableRights = rights.filter((r: any) => r.canShare === true);
            const spacePromises = shareableRights.map((r: any) =>
                fetch(`${API_BASE}/api/Space/GetById/${r.spaceId}`, {
                    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
                }).then(r => r.ok ? r.json() : null)
            );
            const resolvedSpaces = await Promise.all(spacePromises);
            usageSpaces = resolvedSpaces.filter(Boolean);
        }

        const allSpaces = [...ownerSpaces, ...usageSpaces];
        const uniqueSpaces = Array.from(new Map(allSpaces.map((item) => [item.id || item.Id, item])).values());
        
        setMySpaces((prev) => {
          const combined = [...prev, ...uniqueSpaces];
          return Array.from(new Map(combined.map((item) => [item.id || item.Id, item])).values());
        });


      } catch (err) {
        console.error(err);
      }
    };
    fetchMySpaces();
  }, [isOpen, token]);

  // Nhớ những categoryId đã từng gọi API (kể cả lỗi) để không gọi lặp lại vô hạn
  const attemptedCategoryIdsRef = React.useRef<Set<string>>(new Set());

  // Lấy tên ngành nghề được phép kinh doanh của mặt bằng đang chọn (khi mở panel chi tiết)
  useEffect(() => {
    if (!isSpaceDetailOpen || !token || !contractData.spaceId) return;
    const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));
    const allowedCategories: any[] = selectedSpace?.spaceAllowedCategories || selectedSpace?.SpaceAllowedCategories || [];
    const idsToFetch = Array.from(
      new Set(
        allowedCategories
          .map((c: any) => c.bussinessCategoryId ?? c.BussinessCategoryId)
          .filter((id) => id != null && !attemptedCategoryIdsRef.current.has(String(id)))
      )
    );
    if (idsToFetch.length === 0) return;
    idsToFetch.forEach((id) => attemptedCategoryIdsRef.current.add(String(id)));

    const fetchCategoryNames = async () => {
      const results = await Promise.all(
        idsToFetch.map(async (id) => {
          try {
            const res = await fetch(`${API_BASE}/api/BussinessCategory/GetById${id}`, {
              headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
            });
            if (!res.ok) return null;
            const data = await res.json();
            return { id, name: data.name };
          } catch {
            return null;
          }
        })
      );
      setCategoryNames((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r) next[String(r.id)] = r.name;
        });
        return next;
      });
    };
    fetchCategoryNames();
  }, [isSpaceDetailOpen, contractData.spaceId, token, mySpaces]);

  useEffect(() => {
    const checkSpaceRight = async () => {
      if (!contractData.spaceId || !token || !isOpen) {
        setCanShowShareCheckbox(false);
        if (!existingContract) setCanShareSpace(false);
        return;
      }
      const currentUserId = localStorage.getItem('current_user_id');
      const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));
      let isOwner = false;
      if (selectedSpace) {
        isOwner = String(selectedSpace.ownerId || selectedSpace.OwnerId || selectedSpace.userId) === String(currentUserId);
      }
      setCanShowShareCheckbox(isOwner);
    };
    checkSpaceRight();
  }, [contractData.spaceId, token, mySpaces, isOpen, existingContract]);

  // Đóng dropdown "Yêu cầu đặt thuê" khi click ra ngoài
  useEffect(() => {
    if (!isBookingReqDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bookingReqDropdownRef.current && !bookingReqDropdownRef.current.contains(e.target as Node)) {
        setIsBookingReqDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBookingReqDropdownOpen]);

  // Khi chọn mặt bằng (tạo mới), điền sẵn diện tích thực tế bằng diện tích của
  // mặt bằng đó — người dùng vẫn có thể sửa lại tay sau đó.
  useEffect(() => {
    if (!isOpen || existingContract || !contractData.spaceId) return;
    const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));
    const spaceArea = selectedSpace ? Number(selectedSpace.area) : NaN;
    if (isNaN(spaceArea)) return;
    setAcreageText(String(spaceArea).replace('.', ','));
    setContractData((prev) => ({ ...prev, acreage: spaceArea }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractData.spaceId, mySpaces, isOpen, existingContract]);

  useEffect(() => {
  if (!isOpen || !token) return;
  if (!lessorId && !lesseeId) return;

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/Profile/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        userId: data.userId,
        fullName: data.fullName || '',
        citizenIDNumber: data.citizenIDNumber || data.identityCardNumber || '',
        dateOfIssue: data.dateOfIssue || '',
      };
    } catch (err) {
      console.error('Fetch profile failed:', userId, err);
      return null;
    }
  };

  const run = async () => {
    setIsLoadingProfiles(true);
    const [lessor, lessee] = await Promise.all([
      lessorId ? fetchProfile(String(lessorId)) : Promise.resolve(null),
      lesseeId ? fetchProfile(String(lesseeId)) : Promise.resolve(null),
    ]);
    setLessorProfile(lessor);
    setLesseeProfile(lessee);
    setIsLoadingProfiles(false);
  };

  run();
  }, [isOpen, token, lessorId, lesseeId]);

  // Lấy các yêu cầu đặt thuê đã match giữa 2 bên
  useEffect(() => {
    if (!isOpen || !token || !activeChat) return;
    const fetchMatchedRequests = async () => {
      setIsLoadingBookingRequests(true);
      try {
        const responses = await Promise.all(
          ['Approved'].map((status) =>
            fetch(`${API_BASE}/api/PrimaryBookingRequest/GetAll?status=${status}`, {
              headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
            })
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => [])
          )
        );
        const allRequests = responses.flatMap((data: any) =>
          Array.isArray(data) ? data : data?.data || data?.items || []
        );
        let matched = allRequests.filter(
          (r: any) => String(r.lessorId) === String(lessorId) && String(r.lesseeId) === String(lesseeId)
        );

        // Nếu đang SỬA hợp đồng và request cũ (VD đã đổi status) không còn nằm
        // trong danh sách Approved -> vẫn add thủ công vào để <select> không mất giá trị
        if (
          existingContract?.primaryBookingRequestId &&
          !matched.some((r) => String(r.id) === String(existingContract.primaryBookingRequestId))
        ) {
          matched = [
            {
              id: existingContract.primaryBookingRequestId,
              offeredPrice: existingContract.price,
              spaceId: existingContract.spaceId,
              duration: existingContract.duration,
            },
            ...matched,
          ];
        }

        setMatchedBookingRequests(matched);

        // Fetch space details using GetById for each matched request so part-spaces are included
        const spaceIdsToFetch = Array.from(new Set(matched.map((r: any) => r.spaceId).filter(Boolean)));
        if (spaceIdsToFetch.length > 0) {
          const spacePromises = spaceIdsToFetch.map(async (id: any) => {
            try {
              const res = await fetch(`${API_BASE}/api/Space/GetById${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) return await res.json();
            } catch {}
            return null;
          });
          
          const resolvedSpaces = (await Promise.all(spacePromises)).filter(Boolean);
          setMySpaces((prev) => {
            const combined = [...prev, ...resolvedSpaces];
            return Array.from(new Map(combined.map((s) => [s.id || s.Id, s])).values());
          });
          

        }

        // Chỉ auto-fill theo request khi đang TẠO MỚI (không phải sửa)
        if (!existingContract && matched.length === 1) {
          const only = matched[0];
          setContractData((prev) => ({
            ...prev,
            primaryBookingRequestId: only.id,
            spaceId: only.spaceId ? String(only.spaceId) : prev.spaceId,
            price: only.offeredPrice ?? prev.price,
            duration: only.duration ?? prev.duration,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingBookingRequests(false);
      }
    };
    fetchMatchedRequests();
  }, [isOpen, token, activeChat, lessorId, lesseeId, existingContract]);

  // Ngày kết thúc = ngày bắt đầu + thời lượng (tính theo đơn vị Ngày/Tuần/Tháng/Năm)
  const computeEndDate = (startDate: string, duration: number, unit: string): string => {
    if (!startDate || !duration) return '';
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return '';
    if (unit === 'Days') d.setDate(d.getDate() + duration);
    else if (unit === 'Weeks') d.setDate(d.getDate() + duration * 7);
    else if (unit === 'Months') d.setMonth(d.getMonth() + duration);
    else if (unit === 'Years') d.setFullYear(d.getFullYear() + duration);
    return d.toLocaleDateString('vi-VN');
  };

  const formatDurationLabel = (duration: number, unit: string) => {
    const unitLabel =
      unit === 'Days' ? 'ngày' : unit === 'Weeks' ? 'tuần' : unit === 'Months' ? 'tháng' : 'năm';
    return duration ? `${duration} ${unitLabel}` : '';
  };

  // Bật/tắt 1 ngày trong lịch hoạt động. Khi bật -> thêm với khung giờ mặc
  // định 08:00-22:00 (có thể sửa lại). Khi tắt -> xóa hẳn khỏi mảng.
  const toggleScheduleDay = (day: number) => {
    setContractData((prev) => {
      const exists = prev.contractSchedules.find((s) => s.dayOfWeek == day);
      if (exists) {
        return {
          ...prev,
          contractSchedules: prev.contractSchedules.filter((s) => s.dayOfWeek != day),
        };
      }
      return {
        ...prev,
        contractSchedules: [...prev.contractSchedules, { dayOfWeek: day, startTime: '08:00', endTime: '22:00' }],
      };
    });
  };

  // Sửa giờ bắt đầu/kết thúc riêng cho 1 ngày cụ thể (mỗi ngày có thể có
  // khung giờ khác nhau, vd Chủ Nhật mở trễ hơn ngày thường).
  const updateScheduleTime = (day: number, field: 'startTime' | 'endTime', value: string) => {
    setContractData((prev) => ({
      ...prev,
      contractSchedules: prev.contractSchedules.map((s) =>
        s.dayOfWeek == day ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Gom toàn bộ dữ liệu đang nhập ở form (giá, cọc, diện tích, ngày, lịch
  // hoạt động...) thành merge data để đổ trực tiếp vào nội dung mẫu hợp đồng
  // - đây là chỗ đảm bảo thông tin ở phần "Ghi chú điều khoản" luôn khớp với
  // các ô nhập bên trên.
  const buildMergeData = (): ContractMergeData => {
    const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));

    return {
      MA_YEU_CAU_THUE: contractData.primaryBookingRequestId ? `#${contractData.primaryBookingRequestId}` : '',
      NGAY_LAP_HD: new Date().toLocaleDateString('vi-VN'),

      TEN_MAT_BANG: selectedSpace?.name || '',
      DIA_CHI_MAT_BANG: selectedSpace?.address || selectedSpace?.location || selectedSpace?.name || '',
      DIEN_TICH: contractData.acreage ? `${contractData.acreage} m2` : '',
      MUC_DICH_KINH_DOANH: contractData.businessPurpose || '',
      LICH_HOAT_DONG: formatSchedule(contractData.contractSchedules),
      QUYEN_CHO_THUE_LAI: canShareSpace 
        ? 'Bên B ĐƯỢC PHÉP cho bên thứ ba thuê lại mặt bằng này trong thời hạn hợp đồng.'
        : 'Bên B KHÔNG ĐƯỢC PHÉP cho bên thứ ba thuê lại mặt bằng này dưới mọi hình thức, trừ khi có sự đồng ý bằng văn bản của Bên A.',

      GIA_THUE: contractData.price ? `${contractData.price.toLocaleString('vi-VN')} VNĐ/tháng` : '',
      TIEN_COC: contractData.depositAmount ? `${contractData.depositAmount.toLocaleString('vi-VN')} VNĐ` : '',

      THOI_HAN_THUE: formatDurationLabel(contractData.duration, contractData.durationUnit),
      NGAY_BAT_DAU: contractData.startDate ? new Date(contractData.startDate).toLocaleDateString('vi-VN') : '',
      NGAY_KET_THUC: computeEndDate(contractData.startDate, contractData.duration, contractData.durationUnit),

      BEN_A_HO_TEN: lessorProfile?.fullName || activeChat?.lessorName || activeChat?.LessorName || '',
      BEN_B_HO_TEN: lesseeProfile?.fullName || activeChat?.lesseeName || activeChat?.LesseeName || '',
      BEN_A_CCCD: lessorProfile?.citizenIDNumber || '',
      BEN_B_CCCD: lesseeProfile?.citizenIDNumber || '',
      BEN_A_CCCD_NGAY_CAP: lessorProfile?.dateOfIssue
        ? new Date(lessorProfile.dateOfIssue).toLocaleDateString('vi-VN')
        : '',
      BEN_B_CCCD_NGAY_CAP: lesseeProfile?.dateOfIssue
        ? new Date(lesseeProfile.dateOfIssue).toLocaleDateString('vi-VN')
        : '',
    };
  };

  // Ghi nhận lại toàn bộ giá trị vừa render cho từng field - dùng làm "chuỗi cũ"
  // để lần sau còn biết đường tìm mà thay.
  const rememberRenderedValues = (merge: ContractMergeData) => {
    const rendered: Record<string, string> = {};
    (Object.keys(merge) as (keyof ContractMergeData)[]).forEach((key) => {
      rendered[key] = renderMergeValue(key, merge[key]);
    });
    lastRenderedRef.current = rendered;
  };

  // Tạo MỚI HOÀN TOÀN nội dung điều khoản từ mẫu gốc + dữ liệu hiện tại.
  // Dùng khi vừa chọn mẫu, hoặc khi bấm nút "Tạo lại từ đầu" (sẽ ghi đè mọi
  // sửa tay trước đó).
  const regenerateDescriptionFromScratch = (templateId: string) => {
    const tpl = getTemplateById(templateId);
    if (!tpl) return;
    const merge = buildMergeData();
    const filled = fillContractTemplate(tpl, merge);
    rememberRenderedValues(merge);
    setContractData((prev) => ({ ...prev, description: filled }));
  };

  // Dò từng field: nếu giá trị hiển thị của field đó đã đổi so với lần render
  // trước, tìm đúng chuỗi cũ trong nội dung hiện tại và thay bằng chuỗi mới.
  // Field nào bạn đã xóa khỏi nội dung (không còn chuỗi cũ để tìm) sẽ được
  // bỏ qua, không tự chèn lại - giữ nguyên phần bạn đã chỉnh tay.
  const applyMergeDataDiff = (merge: ContractMergeData) => {
    setContractData((prev) => {
      let newDesc = prev.description;
      (Object.keys(merge) as (keyof ContractMergeData)[]).forEach((key) => {
        const newValue = renderMergeValue(key, merge[key]);
        const oldValue = lastRenderedRef.current[key];
        if (oldValue && oldValue !== newValue && newDesc.includes(oldValue)) {
          newDesc = newDesc.split(oldValue).join(newValue);
        }
      });
      return { ...prev, description: newDesc };
    });
  };

  const handlePrintOrPdf = () => {
    if (!contractData.description) return;
    const { header, body } = splitContractHeaderBody(contractData.description);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In Hợp Đồng</title>
            <style>
              body { font-family: 'Times New Roman', serif; font-size: 14pt; padding: 40px; line-height: 1.5; color: #000; }
              .header { text-align: center; margin-bottom: 20px; font-weight: bold; }
              .body { text-align: justify; }
              @media print {
                @page { margin: 2cm; }
              }
            </style>
          </head>
          <body>
            <div class="header">${header.replace(/\n/g, '<br/>')}</div>
            <div class="body">${body.replace(/\n/g, '<br/>')}</div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    regenerateDescriptionFromScratch(templateId);
  };

  // Mỗi khi các trường tài chính/lịch trình/mặt bằng thay đổi -> tự dò và thay
  // đúng chỗ trong nội dung điều khoản, không đụng tới phần bạn đã tự sửa tay.

  useEffect(() => {
    if (!selectedTemplateId) return;
    applyMergeDataDiff(buildMergeData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTemplateId,
    contractData.price,
    contractData.depositAmount,
    contractData.duration,
    contractData.durationUnit,
    contractData.startDate,
    contractData.acreage,
    contractData.businessPurpose,
    contractData.spaceId,
    contractData.primaryBookingRequestId,
    JSON.stringify(contractData.contractSchedules),
    canShareSpace,
    mySpaces,
    lessorProfile,   // thêm
    lesseeProfile,   // thêm
  ]);

  const handlePrintTemplate = () => {
    // In riêng nội dung mẫu (dùng cho case offline: in ra rồi 2 bên ký tay)
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const { header, body } = splitContractHeaderBody(contractData.description || '');
    const escapeHtml = (s: string) => s.replace(/</g, '&lt;');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hợp đồng thuê mặt bằng</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; font-size: 14px; }
            .contract-header { text-align: center; white-space: pre-wrap; margin-bottom: 16px; }
            .contract-body { text-align: left; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="contract-header">${escapeHtml(header)}</div>
          <div class="contract-body">${escapeHtml(body)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractData.primaryBookingRequestId) return showToast('Vui lòng chọn yêu cầu đặt thuê!', 'error');
    if (!contractData.businessPurpose.trim()) return showToast('Vui lòng nhập mục đích kinh doanh!', 'error');
    const selectedSpaceForSubmit = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));
    const maxAreaForSubmit = selectedSpaceForSubmit ? Number(selectedSpaceForSubmit.area) : null;
    if (maxAreaForSubmit && !isNaN(maxAreaForSubmit) && contractData.acreage > maxAreaForSubmit) {
      return showToast(`Diện tích không được vượt quá diện tích mặt bằng (${maxAreaForSubmit} m²)!`, 'error');
    }
    setIsCreatingContract(true);
    const roomId = activeChat?.conversationId || activeChat?.id || activeChat?.Id;

    const payload = {
      conversationId: roomId,
      spaceId: Number(contractData.spaceId) || 0,
      primaryBookingRequestId: Number(contractData.primaryBookingRequestId) || 0,
      durationUnit: contractData.durationUnit,
      duration: Number(contractData.duration),
      startDate: new Date(contractData.startDate).toISOString(),
      acreage: Number(contractData.acreage),
      price: Number(contractData.price),
      depositAmount: Number(contractData.depositAmount),
      description: contractData.description,
      businessPurpose: contractData.businessPurpose,
      // Có thể là mảng rỗng nếu không chọn ngày nào -> BE nhận null/[] đều ok
      contractSchedules: contractData.contractSchedules,
      canShare: canShareSpace,
      canGrantSharePermission: canShareSpace,
    };

    try {
      if (isEditMode) {
        // ---- CHẾ ĐỘ SỬA: PUT /api/Contract/Update/{id} ----
        const updateRes = await fetch(`${API_BASE}/api/Contract/Update/${existingContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!updateRes.ok) {
          const errBody = await updateRes.text().catch(() => '');
          console.error('Update contract failed:', updateRes.status, errBody);
          throw new Error('Lỗi cập nhật hợp đồng: ' + (errBody || updateRes.status));
        }

        // Đã bỏ dòng FE tự gửi tin nhắn, vì BE sẽ tự động bắn ID hợp đồng về.
        // await onCreated(`✏️ Tôi vừa cập nhật Hợp đồng (Mã: #${existingContract.id}). Vui lòng kiểm tra lại nhé!`);
        showToast('Cập nhật hợp đồng thành công!');
        setTimeout(onClose, 1200);
      } else {
        // ---- CHẾ ĐỘ TẠO MỚI: POST /api/Contract/Create + share ----
        const createPayload = { ...payload, lessorId, lesseeId };
        const createRes = await fetch(`${API_BASE}/api/Contract/Create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(createPayload),
        });
        if (!createRes.ok) {
          const errBody = await createRes.text().catch(() => '');
          console.error('Create contract failed:', createRes.status, errBody);
          throw new Error('Lỗi tạo hợp đồng: ' + (errBody || createRes.status));
        }
        const createdContract = await createRes.json();
        const newContractId = createdContract.id || createdContract.Id;

        if (newContractId) {
          const shareRes = await fetch(`${API_BASE}/api/Contract/${newContractId}/share`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
          });
          if (!shareRes.ok) throw new Error('Lỗi share hợp đồng');

          // Đã bỏ dòng FE tự gửi tin nhắn, để cho FloatingChat tự parse ID từ BE.
          // await onCreated(`📄 Tôi vừa tạo và gửi một Hợp đồng (Mã: #${newContractId}). Vui lòng kiểm tra và xác nhận nhé!`);
          showToast('Tạo hợp đồng thành công!');
          setTimeout(onClose, 1200);
        }
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsCreatingContract(false);
    }
  };

  if (!isOpen) return null;

  const selectedTemplate = getTemplateById(selectedTemplateId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Toast toast={toast} />
      {confirmModal}
      <style>
        {`
          .cc-input {
            width: 100%; padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
            background-color: #F8FAFC; font-size: 13px; color: #1E293B; outline: none;
            box-sizing: border-box; transition: all 0.2s ease;
          }
          .cc-input:focus { border-color: #10B981; background-color: #fff; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
          .cc-label { font-size: 12.5px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; }
          .cc-card { background: #fff; border-radius: 10px; padding: 16px; border: 1px solid #E2E8F0; margin-bottom: 14px; }
          .cc-card-header { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .cc-scrollbar::-webkit-scrollbar { width: 6px; }
          .cc-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
          .cc-template-option {
            border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; cursor: pointer;
            transition: all 0.15s ease; margin-bottom: 8px;
          }
          .cc-template-option:hover { border-color: #94A3B8; }
          .cc-template-option.active { border-color: #10B981; background-color: #ECFDF5; }
          .cc-schedule-row {
            display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
          }
          .cc-schedule-time {
            padding: 5px 8px; font-size: 12.5px;
          }
        `}
      </style>

      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          height: '88vh',
          backgroundColor: '#F1F5F9',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1E293B',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> {isEditMode ? `Chỉnh Sửa Hợp Đồng #${existingContract.id}` : 'Tạo Hợp Đồng Thuê'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Body: 2 cột */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* CỘT TRÁI: FORM */}
          <form
            onSubmit={handleSubmit}
            className="cc-scrollbar"
            style={{ width: '48%', overflowY: 'auto', padding: '20px', borderRight: '1px solid #E2E8F0' }}
          >
            <div className="cc-card">
              <div className="cc-card-header">
                <Building2 size={14} color="#64748B" /> Thông tin định danh 2 bên
              </div>
              {isLoadingProfiles ? (
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Đang tải thông tin định danh...</span>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#1E293B' }}>Bên A (bên cho thuê)</div>
                    <div>{lessorProfile?.fullName || <span style={{ color: '#CBD5E1' }}>Chưa lấy được</span>}</div>
                    <div style={{ color: '#64748B', marginTop: 2 }}>
                      CCCD: {lessorProfile?.citizenIDNumber || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#1E293B' }}>Bên B (người thuê)</div>
                    <div>{lesseeProfile?.fullName || <span style={{ color: '#CBD5E1' }}>Chưa lấy được</span>}</div>
                    <div style={{ color: '#64748B', marginTop: 2 }}>
                      CCCD: {lesseeProfile?.citizenIDNumber || '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="cc-card">
              <div className="cc-card-header">
                <Briefcase size={14} color="#64748B" /> Liên kết yêu cầu
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="cc-label">Yêu cầu đặt thuê</label>
                <div ref={bookingReqDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="cc-input"
                    disabled={isLoadingBookingRequests}
                    onClick={() => setIsBookingReqDropdownOpen((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: isLoadingBookingRequests ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span>
                      {(() => {
                        if (isLoadingBookingRequests) return '-- Đang tải... --';
                        const selected = matchedBookingRequests.find(
                          (r) => String(r.id) === String(contractData.primaryBookingRequestId)
                        );
                        if (!selected) return '-- Chọn yêu cầu --';
                        const space = mySpaces.find((s) => String(s.id || s.Id) === String(selected.spaceId));
                        return `${space?.name || 'Mặt bằng trống'} - ${Number(selected.offeredPrice || 0).toLocaleString('vi-VN')}₫`;
                      })()}
                    </span>
                    <ChevronDown size={14} />
                  </button>

                  {isBookingReqDropdownOpen && !isLoadingBookingRequests && (
                    <div
                      className="cc-scrollbar"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 20,
                        maxHeight: '260px',
                        overflowY: 'auto',
                      }}
                    >
                      {matchedBookingRequests.map((req) => {
                        const space = mySpaces.find((s) => String(s.id || s.Id) === String(req.spaceId));
                        const isActive = String(contractData.primaryBookingRequestId) === String(req.id);
                        const isHovered = hoveredBookingReqId === req.id;
                        return (
                          <div
                            key={req.id}
                            onMouseEnter={() => setHoveredBookingReqId(req.id)}
                            onMouseLeave={() => setHoveredBookingReqId((v) => (v === req.id ? null : v))}
                            style={{ position: 'relative' }}
                          >
                            <div
                              onClick={() => {
                                setContractData((prev) => ({
                                  ...prev,
                                  primaryBookingRequestId: req.id,
                                  spaceId: req.spaceId ? String(req.spaceId) : prev.spaceId,
                                  price: req.offeredPrice ?? prev.price,
                                  duration: req.duration ?? prev.duration,
                                }));
                                setIsBookingReqDropdownOpen(false);
                              }}
                              style={{
                                padding: '9px 12px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                color: isActive ? '#fff' : '#1E293B',
                                background: isActive ? '#3B82F6' : isHovered ? '#F1F5F9' : 'transparent',
                              }}
                            >
                              {space?.name || 'Mặt bằng trống'} - {Number(req.offeredPrice || 0).toLocaleString('vi-VN')}₫
                            </div>

                            {isHovered && (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: 'calc(100% + 8px)',
                                  top: 0,
                                  width: '240px',
                                  background: '#1E293B',
                                  color: '#F1F5F9',
                                  borderRadius: '8px',
                                  padding: '10px 12px',
                                  fontSize: '12px',
                                  lineHeight: 1.6,
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                                  zIndex: 30,
                                  pointerEvents: 'none',
                                }}
                              >
                                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                                  Yêu cầu #{req.id}
                                </div>
                                <div>
                                  <strong>Giá đề xuất:</strong>{' '}
                                  {Number(req.offeredPrice || 0).toLocaleString('vi-VN')}₫
                                </div>
                                <div>
                                  <strong>Thời hạn:</strong>{' '}
                                  {formatDurationLabel(req.duration, req.durationUnit) || '—'}
                                </div>
                                <div>
                                  <strong>Ngày dự kiến bắt đầu:</strong>{' '}
                                  {req.expectedStartDate
                                    ? new Date(req.expectedStartDate).toLocaleDateString('vi-VN')
                                    : '—'}
                                </div>
                                {req.purpose && (
                                  <div>
                                    <strong>Mục đích:</strong> {req.purpose}
                                  </div>
                                )}
                                {req.note && (
                                  <div>
                                    <strong>Ghi chú:</strong> {req.note}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!isLoadingBookingRequests && matchedBookingRequests.length === 0 && (
                  <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                    Không tìm thấy yêu cầu khớp giữa 2 bên.
                  </span>
                )}
              </div>
              <div>
                <label className="cc-label">Mặt bằng cấp phát</label>
                <select
                  className="cc-input"
                  required
                  value={contractData.spaceId}
                  onChange={(e) => setContractData({ ...contractData, spaceId: e.target.value })}
                  disabled={true}
                  style={{ backgroundColor: '#F1F5F9', cursor: 'not-allowed', color: '#64748B' }}
                >
                  <option value="" disabled>
                    -- Chọn mặt bằng --
                  </option>
                  {mySpaces.map((space) => (
                    <option key={space.id || space.Id} value={space.id || space.Id}>
                      {space.name || `Mặt bằng #${space.id || space.Id}`}
                    </option>
                  ))}
                </select>
                {!!contractData.primaryBookingRequestId && (
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                    Mặt bằng được tự động chọn theo yêu cầu đặt thuê đã chọn ở trên.
                  </span>
                )}
                {contractData.spaceId && (() => {
                  const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));
                  if (!selectedSpace) return null;
                  const amenities: any[] = selectedSpace.amenities || selectedSpace.Amenities || [];
                  const operatingHours: any[] = selectedSpace.operatingHours || selectedSpace.OperatingHours || [];
                  const allowedCategories: any[] = selectedSpace.spaceAllowedCategories || selectedSpace.SpaceAllowedCategories || [];
                  return (
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setIsSpaceDetailOpen((v) => !v)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} color="#64748B" /> Xem chi tiết mặt bằng
                        </span>
                        {isSpaceDetailOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isSpaceDetailOpen && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '12px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            color: '#334155',
                          }}
                        >
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Tên mặt bằng:</strong> {selectedSpace.name || '—'}
                          </div>

                          <div style={{ marginBottom: '6px' }}>
                            <strong>Địa chỉ:</strong>{' '}
                            {[selectedSpace.address, selectedSpace.city].filter(Boolean).join(', ') || '—'}
                          </div>
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Diện tích:</strong> {selectedSpace.area ? `${selectedSpace.area} m²` : '—'}
                          </div>
                          <div style={{ marginBottom: '6px' }}>
                            <strong>Tiện ích:</strong>{' '}
                            {amenities.length > 0
                              ? amenities.map((a) => a.name || a.Name).filter(Boolean).join(', ')
                              : 'Không có'}
                          </div>
                          <div style={{ marginBottom: operatingHours.length ? '6px' : 0 }}>
                            <strong>Ngành nghề được phép kinh doanh:</strong>{' '}
                            {allowedCategories.length > 0
                              ? allowedCategories
                                  .map((c) => {
                                    const catId = c.bussinessCategoryId ?? c.BussinessCategoryId;
                                    return categoryNames[String(catId)] || `#${catId}`;
                                  })
                                  .join(', ')
                              : 'Không giới hạn'}
                          </div>
                          {operatingHours.length > 0 && (
                            <div>
                              <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <Clock size={12} /> Giờ hoạt động:
                              </strong>
                              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                {operatingHours.map((oh, idx) => (
                                  <li key={idx}>
                                    {OPERATING_DAY_LABELS[oh.dayOfWeek ?? oh.DayOfWeek] || '—'}:{' '}
                                    {(oh.openTime || oh.OpenTime || '').slice(0, 5)} -{' '}
                                    {(oh.closeTime || oh.CloseTime || '').slice(0, 5)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card-header">
                <Wallet size={14} color="#64748B" /> Thông số Tài chính
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="cc-label">Giá thuê (VNĐ)</label>
                  <input
                    className="cc-input"
                    type="number"
                    required
                    value={contractData.price}
                    onChange={(e) => setContractData({ ...contractData, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="cc-label">Tiền cọc (VNĐ)</label>
                  <input
                    className="cc-input"
                    type="number"
                    required
                    value={contractData.depositAmount}
                    onChange={(e) => setContractData({ ...contractData, depositAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card-header">
                <CalendarDays size={14} color="#64748B" /> Lịch trình Thuê
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="cc-label">Thời lượng</label>
                  <input
                    className="cc-input"
                    type="number"
                    required
                    value={contractData.duration}
                    onChange={(e) => setContractData({ ...contractData, duration: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="cc-label">Đơn vị tính</label>
                  <select
                    className="cc-input"
                    value={contractData.durationUnit}
                    onChange={(e) => setContractData({ ...contractData, durationUnit: e.target.value })}
                  >
                    {DURATION_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="cc-label">Ngày bắt đầu</label>
                <input
                  className="cc-input"
                  type="date"
                  required
                  value={contractData.startDate}
                  onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                />
              </div>
            </div>

            {/* LỊCH HOẠT ĐỘNG TRONG TUẦN - chọn nhiều ngày, mỗi ngày 1 khung giờ riêng */}
            <div className="cc-card">
              <div className="cc-card-header">
                <CalendarDays size={14} color="#64748B" /> Lịch hoạt động trong tuần
              </div>
              {DAYS_OF_WEEK.map((d) => {
                const schedule = contractData.contractSchedules.find((s) => s.dayOfWeek == d.value);
                const checked = !!schedule;
                return (
                  <div key={d.value} className="cc-schedule-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleScheduleDay(d.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ width: '64px', fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                      {d.label}
                    </span>
                    {checked && (
                      <>
                        <input
                          type="time"
                          className="cc-input cc-schedule-time"
                          style={{ width: 'auto' }}
                          value={schedule!.startTime}
                          onChange={(e) => updateScheduleTime(d.value, 'startTime', e.target.value)}
                        />
                        <span style={{ color: '#94A3B8' }}>-</span>
                        <input
                          type="time"
                          className="cc-input cc-schedule-time"
                          style={{ width: 'auto' }}
                          value={schedule!.endTime}
                          onChange={(e) => updateScheduleTime(d.value, 'endTime', e.target.value)}
                        />
                      </>
                    )}
                  </div>
                );
              })}
              {contractData.contractSchedules.length === 0 && (
                <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                  Chưa chọn ngày nào — có thể để trống nếu mặt bằng không có lịch hoạt động cố định.
                </span>
              )}
            </div>

            <div className="cc-card">
              <div className="cc-card-header">
                <Edit3 size={14} color="#64748B" /> Diện tích
              </div>
              <label className="cc-label">Diện tích thực tế (m²)</label>
              <input
                className="cc-input"
                type="text"
                inputMode="decimal"
                placeholder="VD: 123,00"
                required
                value={acreageText}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Chỉ cho phép chữ số và 1 dấu phẩy, tối đa 2 số sau dấu phẩy — VD: 123,00 / 129,9
                  if (!/^\d*(,\d{0,2})?$/.test(raw)) return;
                  setAcreageText(raw);
                  const numericValue = Number(raw.replace(',', '.'));
                  setContractData({ ...contractData, acreage: isNaN(numericValue) ? 0 : numericValue });
                }}
              />
              {(() => {
                const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));
                const maxArea = selectedSpace ? Number(selectedSpace.area) : null;
                if (!maxArea || isNaN(maxArea)) return null;
                const exceeded = contractData.acreage > maxArea;
                return (
                  <span
                    style={{
                      fontSize: '11px',
                      marginTop: '4px',
                      display: 'block',
                      color: exceeded ? '#EF4444' : '#94A3B8',
                    }}
                  >
                    {exceeded
                      ? `Diện tích không được vượt quá diện tích mặt bằng (${maxArea} m²).`
                      : `Diện tích mặt bằng tối đa: ${maxArea} m².`}
                  </span>
                );
              })()}
            </div>

            {/* MỤC ĐÍCH KINH DOANH - field mới backend yêu cầu */}
            <div className="cc-card">
              <div className="cc-card-header">
                <Building2 size={14} color="#64748B" /> Mục đích kinh doanh
              </div>
              <label className="cc-label">Mục đích sử dụng mặt bằng</label>
              <input
                className="cc-input"
                type="text"
                required
                value={contractData.businessPurpose}
                onChange={(e) => setContractData({ ...contractData, businessPurpose: e.target.value })}
                placeholder="VD: Kinh doanh quán cà phê, cửa hàng thời trang..."
              />
            </div>

            {canShowShareCheckbox && (
              <div className="cc-card" style={{ padding: '12px 16px', backgroundColor: '#ECFDF5', borderColor: '#10B981' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#065F46', fontSize: '13px', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={canShareSpace}
                    onChange={(e) => setCanShareSpace(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
                  />
                  Cho phép bên thuê (Bên B) tạo hợp đồng cho thuê lại mặt bằng này (Sublease)
                </label>
              </div>
            )}

            {/* CHỌN MẪU HỢP ĐỒNG */}
            <div className="cc-card">
              <div className="cc-card-header">
                <FileText size={14} color="#64748B" /> Chọn mẫu hợp đồng
              </div>
              {CONTRACT_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`cc-template-option ${selectedTemplateId === tpl.id ? 'active' : ''}`}
                  onClick={() => handleSelectTemplate(tpl.id)}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>{tpl.label}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{tpl.shortDesc}</div>
                </div>
              ))}

              <label className="cc-label" style={{ marginTop: '10px' }}>
                Ghi chú điều khoản (nội dung mẫu, có thể chỉnh sửa)
              </label>
              <textarea
                className="cc-input"
                rows={6}
                value={contractData.description}
                onChange={(e) => setContractData({ ...contractData, description: e.target.value })}
                style={{ resize: 'vertical', fontFamily: "'Times New Roman', serif", fontSize: '12.5px', lineHeight: 1.5 }}
                placeholder="Chọn 1 mẫu ở trên để đổ nội dung, hoặc tự nhập ghi chú..."
              />
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                Giá thuê, tiền cọc, diện tích, ngày thuê, mục đích kinh doanh, lịch hoạt động... bên trên sẽ tự động
                cập nhật đúng vào chỗ tương ứng trong nội dung bên dưới. Nếu bạn xóa 1 đoạn nào đó đi, đoạn đó sẽ
                không tự hiện lại cho tới khi bạn bấm "Tạo lại từ đầu". Tên, CCCD các bên tạm hiện dạng [...Nhãn...]
                do chưa có API lấy thông tin định danh.
              </span>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handlePrintTemplate}
                  disabled={!contractData.description}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    background: '#fff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: contractData.description ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: contractData.description ? 1 : 0.5,
                  }}
                >
                  <Printer size={14} /> In mẫu (ký tay offline)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedTemplateId) return;
                    const ok = await confirm({
                      title: 'Tạo lại nội dung hợp đồng',
                      message: 'Thao tác này sẽ tạo lại toàn bộ nội dung từ mẫu gốc và GHI ĐÈ mọi chỗ bạn đã tự sửa tay. Tiếp tục?',
                      confirmLabel: 'Tiếp tục',
                      danger: true,
                    });
                    if (!ok) return;
                    regenerateDescriptionFromScratch(selectedTemplateId);
                  }}
                  disabled={!selectedTemplateId}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#B91C1C',
                    cursor: selectedTemplateId ? 'pointer' : 'not-allowed',
                    opacity: selectedTemplateId ? 1 : 0.5,
                  }}
                >
                  Tạo lại từ đầu
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingContract || !contractData.primaryBookingRequestId}
              style={{
                width: '100%',
                marginTop: '4px',
                marginBottom: '10px',
                padding: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                opacity: isCreatingContract || !contractData.primaryBookingRequestId ? 0.6 : 1,
              }}
            >
              {isCreatingContract
                ? (isEditMode ? 'Đang cập nhật...' : 'Đang tạo & Gửi...')
                : (isEditMode ? 'Cập Nhật Hợp Đồng' : 'Phát Hành Hợp Đồng (Online)')}
            </button>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handlePrintOrPdf}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#F8FAFC',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                onMouseOut={(e) => e.currentTarget.style.background = '#F8FAFC'}
              >
                In / Lưu PDF (Offline)
              </button>
            </div>
          </form>

          {/* CỘT PHẢI: PREVIEW LIVE */}
          <div
            className="cc-scrollbar"
            style={{ width: '52%', overflowY: 'auto', padding: '28px 36px', backgroundColor: '#fff' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '8px', color: '#94A3B8', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Xem trước hợp đồng
            </div>
            <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px', fontSize: '18px', color: '#1E293B' }}>
              Hợp đồng Thuê Mặt Bằng
            </h2>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', marginBottom: '24px' }}>
              {selectedTemplate ? selectedTemplate.label : (isEditMode ? 'Đang chỉnh sửa nội dung hiện có' : 'Chưa chọn mẫu')}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 20px',
                fontSize: '13px',
                color: '#334155',
                marginBottom: '20px',
                padding: '14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Giá thuê:</strong> {contractData.price ? contractData.price.toLocaleString('vi-VN') : '...'} VNĐ
              </p>
              <p style={{ margin: 0 }}>
                <strong>Tiền cọc:</strong> {contractData.depositAmount ? contractData.depositAmount.toLocaleString('vi-VN') : '...'} VNĐ
              </p>
              <p style={{ margin: 0 }}>
                <strong>Thời hạn:</strong> {contractData.duration}{' '}
                {DURATION_UNITS.find((u) => u.value === contractData.durationUnit)?.label.toLowerCase() || ''}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Ngày bắt đầu:</strong> {contractData.startDate ? new Date(contractData.startDate).toLocaleDateString('vi-VN') : '...'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Diện tích:</strong> {contractData.acreage || '...'} m²
              </p>
              <p style={{ margin: 0 }}>
                <strong>Mục đích:</strong> {contractData.businessPurpose || '...'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Mặt bằng:</strong>{' '}
                {mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId))?.name || '...'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Lịch hoạt động:</strong> {formatSchedule(contractData.contractSchedules) || '...'}
              </p>
              {canShowShareCheckbox && (
                <p style={{ margin: 0, gridColumn: 'span 2' }}>
                  <strong>Quyền cho thuê lại:</strong> {canShareSpace ? <span style={{ color: '#10B981', fontWeight: 600 }}>Được phép</span> : <span style={{ color: '#EF4444' }}>Không được phép</span>}
                </p>
              )}
            </div>

            <div
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '13px',
                lineHeight: 1.7,
                color: '#1E293B',
                padding: '20px',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                minHeight: '300px',
                backgroundColor: '#FEFEFE',
              }}
            >
              {contractData.description ? (
                (() => {
                  const { header, body } = splitContractHeaderBody(contractData.description);
                  return (
                    <>
                      {header && (
                        <div style={{ textAlign: 'center', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                          {header}
                        </div>
                      )}
                      <div style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{body}</div>
                    </>
                  );
                })()
              ) : (
                <span style={{ color: '#CBD5E1', fontStyle: 'italic', fontFamily: 'system-ui' }}>
                  Chọn 1 mẫu hợp đồng ở cột bên trái để xem nội dung ở đây...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};