import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { Joyride, STATUS, type EventData, type Step } from 'react-joyride';
import { Image as KonvaImage, Layer, Rect, Shape, Stage } from 'react-konva';
import type Konva from 'konva';
import {
  Brush,
  Clock3,
  Download,
  Eraser,
  Hand,
  HelpCircle,
  ImageUp,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Redo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { clearLocalStorageForLogout } from '../../utils/preserveLocalStorage';
import './AiImageEditorPage.css';

type Tool = 'brush' | 'eraser' | 'pan';

interface Stroke {
  id: string;
  points: number[];
  size: number;
  tool: Tool;
}

interface PromptForm {
  prompt: string;
}

interface EditHistoryItem {
  id: string;
  createdAt: string;
  prompt: string;
  imageUrl?: string;
  maskUrl?: string;
}

interface OwnWalletResponse {
  balance?: number;
}

interface GenerateImageResponse {
  imageUrl?: string;
  image?: string;
  base64Image?: string;
  generatedImage?: string;
  result?: string;
  data?: string | {
    imageUrl?: string;
    image?: string;
    base64Image?: string;
    generatedImage?: string;
    result?: string;
  };
}

interface UserAiImageHistoryApiItem {
  id?: string | number;
  userAiImageHistoryId?: string | number;
  historyId?: string | number;
  createdAt?: string;
  createdDate?: string;
  generatedAt?: string;
  updatedAt?: string;
  prompt?: string;
  description?: string;
  note?: string;
  content?: string;
  imageUrl?: string;
  imageResultUrl?: string;
  resultImageUrl?: string;
  resultImage?: string;
  generatedImageUrl?: string;
  generatedImage?: string;
  outputImageUrl?: string;
  outputImage?: string;
  maskUrl?: string;
}

const MAX_IMAGE_SIZE = 4096;
const EDITOR_PADDING = 28;
// TODO: giá tạm thời — thay bằng giá trị thật từ backend khi có endpoint/field cấu hình giá AI image edit.
const AI_EDIT_PRICE = 2000;
const TOUR_STORAGE_KEY_PREFIX = 'ai-image-editor-tour-seen';
const LEGACY_TOUR_STORAGE_KEY = 'ai-image-editor-tour-seen';
const HISTORY_STORAGE_KEY = 'ai-image-editor-history';
const MAX_HISTORY_ITEMS = 12;

const getTourStorageKey = () => {
  const userId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');
  return userId || token ? `${TOUR_STORAGE_KEY_PREFIX}:${userId || token}` : `${TOUR_STORAGE_KEY_PREFIX}:guest`;
};

const tourSteps: Step[] = [
  {
    target: '[data-tour="workspace"]',
    title: 'Khu vực ảnh',
    content: 'Upload ảnh tại đây. Sau khi có ảnh, vùng này dùng để xem ảnh, tô xanh lá neon vùng cần chỉnh và pan khi zoom lớn.',
  },
  {
    target: '[data-tour="tools"]',
    title: 'Công cụ khoanh vùng',
    content: 'Brush để tô xanh lá neon vùng cần chỉnh, eraser để xóa vùng đã tô, pan để kéo ảnh khi zoom. Undo, redo và clear nằm cùng nhóm này.',
  },
  {
    target: '[data-tour="object-image"]',
    title: 'Ảnh object',
    content: 'Nếu muốn AI lấy một vật thể cụ thể để đưa vào vùng tô xanh lá neon, bấm nút này rồi upload ảnh object. Nếu bỏ trống, AI sẽ tự tạo nội dung theo prompt.',
  },
  {
    target: '[data-tour="brush-size"]',
    title: 'Kích thước brush',
    content: 'Điều chỉnh độ lớn của brush hoặc eraser. Vùng tô được quy đổi đúng về kích thước ảnh gốc.',
  },
  {
    target: '[data-tour="zoom"]',
    title: 'Zoom và pan',
    content: 'Phóng to để tô chính xác hơn. Khi zoom lớn, chọn bàn tay để kéo ảnh.',
  },
  {
    target: '[data-tour="prompt"]',
    title: 'Prompt AI',
    content: 'Nhập yêu cầu chỉnh sửa cho vùng đã tô.',
  },
  {
    target: '[data-tour="generate"]',
    title: 'Tạo ảnh',
    content: 'Gửi ảnh gốc đã phủ xanh lá neon vùng cần chỉnh, ảnh object nếu có, và prompt sang luồng xử lý AI.',
  },
  {
    target: '[data-tour="workspace"]',
    title: 'Kết quả',
    content: 'Sau khi AI xử lý xong, ảnh kết quả sẽ thay vào chính khung editor này. Bạn vẫn có thể quay lại ảnh gốc để chỉnh tiếp.',
  },
  {
    target: '[data-tour="history"]',
    title: 'Lịch sử chỉnh ảnh',
    content: 'Bấm vào đây để xem lại các ảnh đã được AI chỉnh sửa, kèm prompt và thời gian tạo ảnh.',
  },
];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const normalizeImageResult = (payload: GenerateImageResponse | string) => {
  if (typeof payload === 'string') {
    return payload.startsWith('data:image') || payload.startsWith('http')
      ? payload
      : `data:image/png;base64,${payload}`;
  }

  if (typeof payload.data === 'string') {
    return payload.data.startsWith('data:image') || payload.data.startsWith('http')
      ? payload.data
      : `data:image/png;base64,${payload.data}`;
  }

  const data = typeof payload.data === 'object' && payload.data ? payload.data : payload;
  const value = data.imageUrl || data.image || data.base64Image || data.generatedImage || data.result;

  if (!value) return '';
  return value.startsWith('data:image') || value.startsWith('http')
    ? value
    : `data:image/png;base64,${value}`;
};

const readErrorMessage = (raw: string, fallback: string) => {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { message?: string; title?: string; errors?: Record<string, string[]> };
    const validationMessages = parsed.errors ? Object.values(parsed.errors).flat().join(' ') : '';
    return parsed.message || validationMessages || parsed.title || fallback;
  } catch {
    return raw.length > 220 ? `${raw.slice(0, 220)}...` : raw;
  }
};

const toHistoryArray = (payload: unknown): UserAiImageHistoryApiItem[] => {
  if (Array.isArray(payload)) return payload as UserAiImageHistoryApiItem[];

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record.data || record.items || record.result || record.userAiImageHistories || record.histories;
    return Array.isArray(candidate) ? candidate as UserAiImageHistoryApiItem[] : [];
  }

  return [];
};

const toHistoryItem = (payload: unknown): UserAiImageHistoryApiItem | null => {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const candidate = record.data || record.result || record.item || payload;
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as UserAiImageHistoryApiItem
    : null;
};

const normalizeUserAiImageHistoryItem = (item: UserAiImageHistoryApiItem, index = 0): EditHistoryItem => ({
    id: String(item.id || item.userAiImageHistoryId || item.historyId || `${item.createdAt || item.generatedAt || Date.now()}-${index}`),
    createdAt: item.createdAt || item.createdDate || item.generatedAt || item.updatedAt || new Date().toISOString(),
    prompt: item.prompt || item.description || item.note || item.content || 'Lịch sử chỉnh ảnh',
    imageUrl: normalizeImageResult(
      item.imageUrl || item.imageResultUrl || item.resultImageUrl || item.resultImage || item.generatedImageUrl || item.generatedImage || item.outputImageUrl || item.outputImage || ''
    ),
    maskUrl: item.maskUrl,
  });

const normalizeUserAiImageHistory = (items: UserAiImageHistoryApiItem[]): EditHistoryItem[] =>
  items.map((item, index) => normalizeUserAiImageHistoryItem(item, index));

export const AiImageEditorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef<Konva.Stage>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const [workspaceSize, setWorkspaceSize] = useState({ width: 920, height: 560 });
  const [imageUrl, setImageUrl] = useState('');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [objectImageUrl, setObjectImageUrl] = useState('');
  const [objectImage, setObjectImage] = useState<HTMLImageElement | null>(null);
  const [isObjectUploaderOpen, setIsObjectUploaderOpen] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(36);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(() => Boolean(localStorage.getItem('portal_token')));
  const [walletError, setWalletError] = useState(() => (localStorage.getItem('portal_token') ? '' : 'Chưa đăng nhập'));
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<EditHistoryItem | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState('');
  const [deletingHistoryId, setDeletingHistoryId] = useState('');
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(() => new Set());
  const [history, setHistory] = useState<EditHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [tourStorageKey, setTourStorageKey] = useState(() => getTourStorageKey());
  const [isTourRunning, setIsTourRunning] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PromptForm>({
    defaultValues: { prompt: '' },
  });

  const imageFrame = useMemo(() => {
    if (!image) {
      return {
        x: 0,
        y: 0,
        width: workspaceSize.width,
        height: workspaceSize.height,
        scale: 1,
      };
    }

    const ratio = Math.min(workspaceSize.width / image.width, workspaceSize.height / image.height);
    const width = Math.round(image.width * ratio);
    const height = Math.round(image.height * ratio);

    return {
      x: Math.round((workspaceSize.width - width) / 2),
      y: Math.round((workspaceSize.height - height) / 2),
      width,
      height,
      scale: ratio,
    };
  }, [image, workspaceSize]);

  const stageSize = workspaceSize;
  const scaleToImage = imageFrame.scale;

  const toDisplayPoints = (points: number[]) =>
    points.map((point, index) => point * scaleToImage + (index % 2 === 0 ? imageFrame.x : imageFrame.y));

  const loadFileIntoWorkspace = async (file: File, successMessage = 'Đã tải ảnh lên.') => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ JPG, PNG hoặc WebP.');
      return;
    }

    const url = URL.createObjectURL(file);
    try {
      const loaded = await loadImage(url);
      if (loaded.width > MAX_IMAGE_SIZE || loaded.height > MAX_IMAGE_SIZE) {
        toast.error('Ảnh tối đa 4096px mỗi chiều.');
        URL.revokeObjectURL(url);
        return;
      }

      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(url);
      setImage(loaded);
      setStrokes([]);
      setRedoStack([]);
      setResultUrl('');
      setZoom(1);
      reset();
      toast.success(successMessage);
    } catch {
      URL.revokeObjectURL(url);
      toast.error('Không thể đọc ảnh này.');
    }
  };

  const onDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    await loadFileIntoWorkspace(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
  });

  const onObjectDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ JPG, PNG hoặc WebP cho ảnh object.');
      return;
    }

    const url = URL.createObjectURL(file);
    try {
      const loaded = await loadImage(url);
      if (loaded.width > MAX_IMAGE_SIZE || loaded.height > MAX_IMAGE_SIZE) {
        toast.error('Ảnh object tối đa 4096px mỗi chiều.');
        URL.revokeObjectURL(url);
        return;
      }

      if (objectImageUrl) URL.revokeObjectURL(objectImageUrl);
      setObjectImageUrl(url);
      setObjectImage(loaded);
      toast.success('Đã tải ảnh object.');
    } catch {
      URL.revokeObjectURL(url);
      toast.error('Không thể đọc ảnh object này.');
    }
  };

  const {
    getRootProps: getObjectRootProps,
    getInputProps: getObjectInputProps,
    isDragActive: isObjectDragActive,
  } = useDropzone({
    onDrop: onObjectDrop,
    multiple: false,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
  });

  useEffect(() => {
    const sourceImageUrl = (location.state as { sourceImageUrl?: string } | null)?.sourceImageUrl;
    if (!sourceImageUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(sourceImageUrl);
        if (!response.ok) throw new Error('fetch failed');
        const blob = await response.blob();
        if (cancelled) return;
        const fileName = sourceImageUrl.split('/').pop()?.split('?')[0] || 'listing-photo.jpg';
        const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        await loadFileIntoWorkspace(file, 'Đã tải ảnh mặt bằng vào trình chỉnh sửa.');
      } catch {
        if (!cancelled) toast.error('Không thể tải ảnh từ tin đăng. Vui lòng tải ảnh thủ công.');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => () => {
    if (objectImageUrl) URL.revokeObjectURL(objectImageUrl);
  }, [objectImageUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      const rect = viewport.getBoundingClientRect();
      setWorkspaceSize({
        width: Math.max(320, Math.floor(rect.width - EDITOR_PADDING)),
        height: Math.max(420, Math.floor(rect.height - EDITOR_PADDING)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [image]);

  const loadWalletBalance = useCallback(() => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      setIsWalletLoading(false);
      setWalletError('Chưa đăng nhập');
      setIsSessionExpired(true);
      return undefined;
    }

    let isMounted = true;
    setIsWalletLoading(true);
    setWalletError('');
    setIsSessionExpired(false);

    fetch(`${API_BASE_URL}/api/Wallet/own`, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: '*/*',
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text().catch(() => '');
          const isAuthError = response.status === 401
            || response.status === 403
            || /not authenticated|unauthorized/i.test(message);

          if (isAuthError) {
            const authError = new Error('Phiên đăng nhập hết hạn');
            authError.name = 'SessionExpiredError';
            throw authError;
          }

          throw new Error(message || `Không thể tải số dư (${response.status})`);
        }

        return response.json() as Promise<OwnWalletResponse>;
      })
      .then((wallet) => {
        if (!isMounted) return;
        setWalletBalance(typeof wallet.balance === 'number' ? wallet.balance : 0);
      })
      .catch((error) => {
        if (!isMounted) return;
        const isSessionError = error instanceof Error && error.name === 'SessionExpiredError';
        setIsSessionExpired(isSessionError);
        setWalletError(error instanceof Error ? error.message : 'Không thể tải số dư');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsWalletLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const timerId = window.setTimeout(() => {
      cleanup = loadWalletBalance();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      cleanup?.();
    };
  }, [loadWalletBalance]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const nextTourStorageKey = getTourStorageKey();
      setTourStorageKey(nextTourStorageKey);

      const hasSeenLegacyTour = localStorage.getItem(LEGACY_TOUR_STORAGE_KEY) === 'true';
      if (hasSeenLegacyTour && !localStorage.getItem(nextTourStorageKey)) {
        localStorage.setItem(nextTourStorageKey, 'true');
      }

      setIsTourRunning(!localStorage.getItem(nextTourStorageKey));
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  const getPointer = () => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return null;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const position = transform.point(pointer);
    const imageX = (position.x - imageFrame.x) / scaleToImage;
    const imageY = (position.y - imageFrame.y) / scaleToImage;

    if (!image || imageX < 0 || imageY < 0 || imageX > image.width || imageY > image.height) return null;
    return [imageX, imageY];
  };

  const startStroke = () => {
    if (!image || tool === 'pan') return;
    const point = getPointer();
    if (!point) return;

    isDrawing.current = true;
    setRedoStack([]);
    setStrokes((prev) => [...prev, {
      id: crypto.randomUUID(),
      points: point,
      size: brushSize / scaleToImage,
      tool,
    }]);
  };

  const moveStroke = () => {
    if (!isDrawing.current) return;
    const point = getPointer();
    if (!point) return;

    setStrokes((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, points: last.points.concat(point) };
      return next;
    });
  };

  const stopStroke = () => {
    isDrawing.current = false;
  };

  const undo = () => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const removed = prev[prev.length - 1];
      setRedoStack((redo) => [removed, ...redo]);
      return prev.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const [restored, ...rest] = prev;
      setStrokes((current) => [...current, restored]);
      return rest;
    });
  };

  const drawSelectionOverlay = (context: Konva.Context) => {
    const canvasContext = context._context;
    canvasContext.save();

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      const displayPoints = toDisplayPoints(stroke.points);

      canvasContext.save();
      canvasContext.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      canvasContext.globalAlpha = 1;
      canvasContext.strokeStyle = '#00FF00';
      canvasContext.lineWidth = stroke.size * scaleToImage;
      canvasContext.lineCap = 'round';
      canvasContext.lineJoin = 'round';
      canvasContext.beginPath();
      canvasContext.moveTo(displayPoints[0], displayPoints[1]);

      for (let index = 2; index < displayPoints.length; index += 2) {
        canvasContext.lineTo(displayPoints[index], displayPoints[index + 1]);
      }

      canvasContext.stroke();
      canvasContext.restore();
    });

    canvasContext.restore();
  };

  const exportMarkedImage = () => {
    if (!image) return '';

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return '';

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;
    const overlayContext = overlayCanvas.getContext('2d');
    if (!overlayContext) return '';

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      overlayContext.save();
      overlayContext.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      overlayContext.globalAlpha = 1;
      overlayContext.strokeStyle = '#00FF00';
      overlayContext.lineWidth = stroke.size;
      overlayContext.lineCap = 'round';
      overlayContext.lineJoin = 'round';
      overlayContext.beginPath();
      overlayContext.moveTo(stroke.points[0], stroke.points[1]);

      for (let index = 2; index < stroke.points.length; index += 2) {
        overlayContext.lineTo(stroke.points[index], stroke.points[index + 1]);
      }

      overlayContext.stroke();
      overlayContext.restore();
    });

    context.drawImage(overlayCanvas, 0, 0);
    return canvas.toDataURL('image/png');
  };

  const exportObjectImage = () => {
    if (!objectImage) return null;

    const canvas = document.createElement('canvas');
    canvas.width = objectImage.naturalWidth;
    canvas.height = objectImage.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(objectImage, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const exportCanvas = () => {
    const dataUrl = exportMarkedImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = 'ai-marked-image.png';
    link.href = dataUrl;
    link.click();
  };

  const persistHistory = (items: EditHistoryItem[]) => {
    setHistory(items);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  };

  const loadEditHistory = useCallback(async () => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      setHistoryError('Chưa đăng nhập');
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/UserAiImageHistory`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      });
      const raw = await response.text();

      if (!response.ok) {
        throw new Error(readErrorMessage(raw, `Không thể tải lịch sử (${response.status})`));
      }

      const parsed = raw ? JSON.parse(raw) as unknown : [];
      const apiHistory = normalizeUserAiImageHistory(toHistoryArray(parsed));
      if (apiHistory.length) {
        setHistory(apiHistory);
      }
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Không thể tải lịch sử ảnh.');
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const openHistory = () => {
    setIsHistoryOpen(true);
    void loadEditHistory();
  };

  const viewHistoryItem = async (item: EditHistoryItem) => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      toast.error('Chưa đăng nhập');
      return;
    }

    setViewingHistoryId(item.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/UserAiImageHistory/${encodeURIComponent(item.id)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      });
      const raw = await response.text();

      if (!response.ok) {
        throw new Error(readErrorMessage(raw, `Không thể xem lịch sử (${response.status})`));
      }

      const parsed = raw ? JSON.parse(raw) as unknown : item;
      const detailSource = Array.isArray(parsed) ? parsed[0] : toHistoryItem(parsed);
      const detail = detailSource ? normalizeUserAiImageHistoryItem(detailSource) : item;
      setSelectedHistory({
        ...item,
        ...detail,
        imageUrl: detail.imageUrl || item.imageUrl,
        maskUrl: detail.maskUrl || item.maskUrl,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xem lại ảnh.');
    } finally {
      setViewingHistoryId('');
    }
  };

  const deleteHistoryItem = async (item: EditHistoryItem) => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      toast.error('Chưa đăng nhập');
      return;
    }

    setDeletingHistoryId(item.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/UserAiImageHistory/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
        },
      });
      const raw = await response.text();

      if (!response.ok) {
        throw new Error(readErrorMessage(raw, `Không thể xóa lịch sử (${response.status})`));
      }

      const nextHistory = history.filter((historyItem) => historyItem.id !== item.id);
      persistHistory(nextHistory);
      if (selectedHistory?.id === item.id) {
        setSelectedHistory(null);
      }
      toast.success('Đã xóa lịch sử ảnh.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa lịch sử ảnh.');
    } finally {
      setDeletingHistoryId('');
    }
  };

  const downloadHistoryImage = async (item: EditHistoryItem) => {
    if (!item.imageUrl) return;

    try {
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `ai-image-${item.id}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const link = document.createElement('a');
      link.href = item.imageUrl;
      link.download = `ai-image-${item.id}.jpg`;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.click();
    }
  };

  const toggleHistoryPrompt = (id: string) => {
    setExpandedPromptIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const processImage = async ({ prompt }: PromptForm) => {
    if (!image) {
      toast.error('Vui lòng tải ảnh trước.');
      return;
    }

    if (!strokes.length) {
      toast.error('Hãy tô vùng cần chỉnh sửa.');
      return;
    }

    const markedImage = exportMarkedImage();
    if (!markedImage) {
      toast.error('Không thể xuất ảnh đã khoanh vùng.');
      return;
    }
    const objectImageForAi = exportObjectImage();

    setIsProcessing(true);
    const loadingToast = toast.loading('AI đang xử lý ảnh...');

    try {
      const token = localStorage.getItem('portal_token');
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
        accept: '*/*',
      };
      const response = await fetch(`${API_BASE_URL}/api/AITool/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base64Image: markedImage,
          base64Obj: objectImageForAi,
          prompt,
        }),
      });
      const raw = await response.text();

      if (!response.ok) {
        const message = readErrorMessage(raw, `Không thể tạo ảnh (${response.status})`);
        throw new Error(message);
      }

      let parsed: GenerateImageResponse | string = raw;
      try {
        parsed = JSON.parse(raw) as GenerateImageResponse;
      } catch {
        parsed = raw.trim();
      }

      const generatedImage = normalizeImageResult(parsed);
      if (!generatedImage) {
        throw new Error('API không trả về ảnh kết quả.');
      }

      const nextHistory = [{
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        prompt,
        imageUrl: generatedImage,
      }, ...history].slice(0, MAX_HISTORY_ITEMS);

      persistHistory(nextHistory);
      setResultUrl(generatedImage);
      toast.success(`Đã tạo ảnh cho: ${prompt.slice(0, 60)}`, { id: loadingToast });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo ảnh.', { id: loadingToast });
    } finally {
      setIsProcessing(false);
      loadWalletBalance();
    }
  };

  const handleTourCallback = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      localStorage.setItem(tourStorageKey, 'true');
      setIsTourRunning(false);
    }
  };

  const formatHistoryTime = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));

  return (
    <div className="ai-editor-page">
      <Joyride
        continuous
        onEvent={handleTourCallback}
        options={{
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayClickAction: false,
          overlayColor: 'rgba(2, 6, 23, 0.72)',
          primaryColor: '#14b8a6',
          buttons: ['back', 'skip', 'primary'],
          showProgress: true,
          skipBeacon: true,
          textColor: '#0f172a',
          zIndex: 100000,
        }}
        run={isTourRunning}
        scrollToFirstStep
        steps={tourSteps}
        locale={{
          back: 'Quay lại',
          close: 'Đóng',
          last: 'Hoàn tất',
          next: 'Tiếp theo',
          skip: 'Bỏ qua',
        }}
        styles={{
          tooltip: {
            borderRadius: 8,
            color: '#0f172a',
            zIndex: 100000,
          },
          buttonBack: {
            color: '#475569',
          },
          buttonClose: {
            display: 'none',
          },
        }}
      />

      <div className="ai-editor-header">
        <div>
          <p className="label-caps">AI IMAGE EDITOR</p>
          <h1>Chỉnh sửa ảnh bằng AI</h1>
          <p>Upload ảnh, tô vùng cần thay đổi và nhập prompt để tạo kết quả.</p>
        </div>
        <div className="ai-editor-header-actions">
          <div className="ai-editor-wallet-balance">
            <span>Số dư tài khoản</span>
            <strong>
              {isWalletLoading
                ? 'Đang tải...'
                : walletError || `${(walletBalance ?? 0).toLocaleString('vi-VN')} VND`}
            </strong>
            {walletError && (
              <button
                type="button"
                onClick={() => {
                  if (isSessionExpired) {
                    clearLocalStorageForLogout();
                    navigate('/login');
                    return;
                  }
                  loadWalletBalance();
                }}
              >
                {isSessionExpired ? 'Đăng nhập lại' : 'Thử lại'}
              </button>
            )}
          </div>
          <button className="ai-editor-ghost-btn" type="button" onClick={() => setIsTourRunning(true)}>
            <HelpCircle size={16} />
            Hướng dẫn
          </button>
          <button className="ai-editor-ghost-btn" type="button" onClick={() => {
            setImage(null);
            setImageUrl('');
            if (objectImageUrl) URL.revokeObjectURL(objectImageUrl);
            setObjectImage(null);
            setObjectImageUrl('');
            setIsObjectUploaderOpen(false);
            setResultUrl('');
            setStrokes([]);
            setRedoStack([]);
          }}>
            <RotateCcw size={16} />
            Ảnh mới
          </button>
        </div>
      </div>

      <div className="ai-editor-layout">
        <section className="ai-editor-workspace" data-tour="workspace">
          {!image ? (
            <div {...getRootProps()} className={`ai-editor-dropzone ${isDragActive ? 'is-active' : ''}`}>
              <input {...getInputProps()} />
              <ImageUp size={42} />
              <h2>Click hoặc kéo-thả ảnh vào đây</h2>
              <p>Hỗ trợ JPG, PNG, WebP.</p>
            </div>
          ) : isProcessing ? (
            <div className="ai-editor-canvas-wrap">
              <div className="ai-editor-processing-card ai-editor-processing-card--workspace" role="status" aria-live="polite">
                <div className="ai-editor-processing-preview">
                  <div className="ai-editor-processing-grid" />
                  <div className="ai-editor-processing-scan" />
                  <Sparkles className="ai-editor-processing-sparkle" size={34} />
                </div>
                <div className="ai-editor-processing-copy">
                  <Loader2 className="ai-editor-spin" size={20} />
                  <div>
                    <strong>AI đang xử lý ảnh</strong>
                    <span>Đang phân tích vùng khoanh xanh lá neon và tạo ảnh kết quả...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : resultUrl ? (
            <div className="ai-editor-canvas-wrap">
              <div className="ai-editor-workspace-result">
                <img src={resultUrl} alt="AI generated result" />
                <div className="ai-editor-workspace-result-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setResultUrl('');
                      setStrokes([]);
                      setRedoStack([]);
                      setZoom(1);
                    }}
                  >
                    <RotateCcw size={16} />
                    Quay lại ảnh gốc
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ai-editor-canvas-wrap" ref={viewportRef}>
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={zoom}
                scaleY={zoom}
                draggable={tool === 'pan'}
                onMouseDown={startStroke}
                onMousemove={moveStroke}
                onMouseup={stopStroke}
                onTouchStart={startStroke}
                onTouchMove={moveStroke}
                onTouchEnd={stopStroke}
                className="ai-editor-stage"
              >
                <Layer>
                  <Rect width={stageSize.width} height={stageSize.height} fill="#f8fafc" />
                  <KonvaImage
                    image={image}
                    x={imageFrame.x}
                    y={imageFrame.y}
                    width={imageFrame.width}
                    height={imageFrame.height}
                  />
                </Layer>
                <Layer listening={false}>
                  <Shape
                    width={stageSize.width}
                    height={stageSize.height}
                    sceneFunc={(context) => drawSelectionOverlay(context)}
                  />
                </Layer>
              </Stage>
            </div>
          )}
        </section>

        <aside className="ai-editor-panel">
          <div className="ai-editor-tools" data-tour="tools">
            <button className={tool === 'brush' ? 'is-selected' : ''} type="button" title="Brush" disabled={Boolean(resultUrl)} onClick={() => setTool('brush')}>
              <Brush size={18} />
            </button>
            <button className={tool === 'eraser' ? 'is-selected' : ''} type="button" title="Eraser" disabled={Boolean(resultUrl)} onClick={() => setTool('eraser')}>
              <Eraser size={18} />
            </button>
            <button className={tool === 'pan' ? 'is-selected' : ''} type="button" title="Pan" disabled={Boolean(resultUrl)} onClick={() => setTool('pan')}>
              <Hand size={18} />
            </button>
            <button type="button" title="Undo" disabled={!strokes.length || Boolean(resultUrl)} onClick={undo}><Undo2 size={18} /></button>
            <button type="button" title="Redo" disabled={!redoStack.length || Boolean(resultUrl)} onClick={redo}><Redo2 size={18} /></button>
            <button type="button" title="Clear selection" disabled={!strokes.length || Boolean(resultUrl)} onClick={() => { setStrokes([]); setRedoStack([]); }}><Trash2 size={18} /></button>
          </div>

          <button
            className={`ai-editor-object-open-btn ${objectImage ? 'has-object' : ''}`}
            type="button"
            disabled={Boolean(resultUrl)}
            onClick={() => setIsObjectUploaderOpen(true)}
            data-tour="object-image"
          >
            <ImageUp size={17} />
            {objectImage ? 'Đã chọn ảnh vật thể' : 'Thêm ảnh vật thể'}
          </button>

          <label className="ai-editor-control" data-tour="brush-size">
            <span>Kích thước brush: {brushSize}px</span>
            <input type="range" min="8" max="96" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
          </label>

          <div className="ai-editor-zoom-row" data-tour="zoom">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}><ZoomOut size={16} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))}><ZoomIn size={16} /></button>
          </div>

          <form
            className="ai-editor-form"
            onSubmit={handleSubmit((data) => {
              void processImage(data);
            })}
          >
            <label data-tour="prompt">
              Prompt
              <textarea
                rows={5}
                placeholder="Ví dụ: thay vùng tô thành nội thất văn phòng hiện đại, ánh sáng tự nhiên..."
                {...register('prompt', {
                  required: 'Vui lòng nhập prompt.',
                  minLength: { value: 10, message: 'Prompt cần ít nhất 10 ký tự.' },
                })}
              />
            </label>
            {errors.prompt && <p className="ai-editor-error">{errors.prompt.message}</p>}
            <button className="ai-editor-primary-btn" type="submit" disabled={isProcessing || !image || Boolean(resultUrl)} data-tour="generate">
              {isProcessing ? <Loader2 className="ai-editor-spin" size={18} /> : <Sparkles size={18} />}
              Tạo ảnh · {AI_EDIT_PRICE.toLocaleString('vi-VN')} VND
            </button>
          </form>

          <button className="ai-editor-ghost-btn" type="button" disabled={!image || Boolean(resultUrl)} onClick={exportCanvas}>
            <Download size={16} />
            Xuất ảnh khoanh vùng
          </button>

          <button className="ai-editor-ghost-btn" type="button" onClick={openHistory} data-tour="history">
            <Clock3 size={16} />
            Xem lịch sử ảnh
          </button>
        </aside>
      </div>

      {isObjectUploaderOpen && (
        <div className="ai-editor-object-modal-backdrop" role="presentation" onClick={() => setIsObjectUploaderOpen(false)}>
          <section
            className="ai-editor-object-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-object-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="label-caps">OBJECT IMAGE</p>
                <h2 id="ai-object-modal-title">Ảnh vật thể muốn thêm</h2>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setIsObjectUploaderOpen(false)}>
                <X size={18} />
              </button>
            </header>

            {objectImageUrl ? (
              <div className="ai-editor-object-preview ai-editor-object-preview--modal">
                <img src={objectImageUrl} alt="Object preview" />
                <div>
                  <span>Ảnh vật thể hiện tại</span>
                  <p>AI sẽ lấy vật thể từ ảnh này và đưa vào vùng bạn đã tô xanh lá neon trên ảnh gốc.</p>
                  <div className="ai-editor-object-modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        if (objectImageUrl) URL.revokeObjectURL(objectImageUrl);
                        setObjectImageUrl('');
                        setObjectImage(null);
                      }}
                    >
                      <Trash2 size={15} />
                      Xóa vật thể
                    </button>
                    <button type="button" onClick={() => setIsObjectUploaderOpen(false)}>
                      Xong
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div {...getObjectRootProps()} className={`ai-editor-object-dropzone ai-editor-object-dropzone--modal ${isObjectDragActive ? 'is-active' : ''}`}>
                <input {...getObjectInputProps()} />
                <ImageUp size={32} />
                <strong>Thêm ảnh vật thể (VD: cái bàn, chậu cây...)</strong>
                <span>Tải lên ảnh của vật thể bạn muốn thêm vào vùng đã tô. Nếu để trống, AI sẽ tự tạo nội dung dựa theo prompt.</span>
              </div>
            )}
          </section>
        </div>
      )}

      {isHistoryOpen && (
        <div className="ai-editor-history-modal-backdrop" role="presentation" onClick={() => setIsHistoryOpen(false)}>
          <section
            className="ai-editor-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-editor-history-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ai-editor-history-modal-header">
              <div>
                <p className="label-caps">HISTORY</p>
                <h2 id="ai-editor-history-title">Lịch sử ảnh đã chỉnh</h2>
              </div>
              <div className="ai-editor-history-modal-actions">
                <button
                  className="ai-editor-ghost-btn"
                  type="button"
                  disabled={isHistoryLoading}
                  onClick={() => {
                    void loadEditHistory();
                  }}
                >
                  {isHistoryLoading ? <Loader2 className="ai-editor-spin" size={16} /> : <RotateCcw size={16} />}
                  Làm mới
                </button>
                <button className="ai-editor-icon-btn" type="button" aria-label="Đóng lịch sử" onClick={() => setIsHistoryOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {isHistoryLoading ? (
              <div className="ai-editor-history-empty">
                Đang tải lịch sử ảnh...
              </div>
            ) : historyError ? (
              <div className="ai-editor-history-empty">
                {historyError}
              </div>
            ) : history.length ? (
              <div className="ai-editor-history-modal-grid">
                {history.map((item) => {
                  const isPromptExpanded = expandedPromptIds.has(item.id);
                  const canExpandPrompt = item.prompt.length > 96;

                  return (
                    <article className={`ai-editor-history-modal-card ${isPromptExpanded ? 'is-expanded' : ''}`} key={item.id}>
                      {item.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            void viewHistoryItem(item);
                          }}
                        >
                          <img src={item.imageUrl} alt={item.prompt} />
                        </button>
                      ) : (
                        <div className="ai-editor-history-image-empty">
                          Không có ảnh đính kèm
                        </div>
                      )}
                      <div className="ai-editor-history-modal-meta">
                        <span>
                          <Clock3 size={14} />
                          {formatHistoryTime(item.createdAt)}
                        </span>
                        <p className={isPromptExpanded ? 'is-expanded' : ''}>{item.prompt}</p>
                        {canExpandPrompt && (
                          <button
                            className="ai-editor-history-more-btn"
                            type="button"
                            onClick={() => toggleHistoryPrompt(item.id)}
                          >
                            {isPromptExpanded ? 'Thu gọn' : 'Xem thêm'}
                          </button>
                        )}
                      </div>
                      <div className="ai-editor-history-actions">
                        <button
                          type="button"
                          disabled={viewingHistoryId === item.id}
                          onClick={() => {
                            void viewHistoryItem(item);
                          }}
                        >
                          {viewingHistoryId === item.id ? 'Đang mở...' : 'Xem lại'}
                        </button>
                        <button
                          type="button"
                          className="ai-editor-history-delete-btn"
                          disabled={deletingHistoryId === item.id}
                          onClick={() => {
                            void deleteHistoryItem(item);
                          }}
                        >
                          <Trash2 size={14} />
                          {deletingHistoryId === item.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="ai-editor-history-empty">
                Chưa có ảnh nào trong lịch sử.
              </div>
            )}
          </section>
        </div>
      )}

      {selectedHistory && (
        <div className="ai-editor-preview-modal-backdrop" role="presentation" onClick={() => setSelectedHistory(null)}>
          <section
            className="ai-editor-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-editor-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ai-editor-preview-modal-header">
              <div>
                <p className="label-caps">PREVIEW</p>
                <h2 id="ai-editor-preview-title">Ảnh đã chỉnh</h2>
              </div>
              <div className="ai-editor-preview-header-actions">
                <button
                  type="button"
                  disabled={!selectedHistory.imageUrl}
                  onClick={() => {
                    void downloadHistoryImage(selectedHistory);
                  }}
                >
                  <Download size={16} />
                  Xuất ảnh
                </button>
                <button
                  type="button"
                  className="ai-editor-preview-delete-btn"
                  disabled={deletingHistoryId === selectedHistory.id}
                  onClick={() => {
                    void deleteHistoryItem(selectedHistory);
                  }}
                >
                  <Trash2 size={16} />
                  {deletingHistoryId === selectedHistory.id ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button className="ai-editor-icon-btn" type="button" aria-label="Đóng ảnh xem lại" onClick={() => setSelectedHistory(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="ai-editor-preview-modal-body">
              {selectedHistory.imageUrl ? (
                <img src={selectedHistory.imageUrl} alt={selectedHistory.prompt} />
              ) : (
                <div className="ai-editor-preview-empty">Không có ảnh đính kèm</div>
              )}

              <div className="ai-editor-preview-prompt">
                <span>Prompt</span>
                <p>{selectedHistory.prompt}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};


