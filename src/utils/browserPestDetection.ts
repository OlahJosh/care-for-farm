import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true; // Cache models in browser for faster reloads

// Model options with different sizes
export const MODEL_OPTIONS = {
  tiny: {
    id: 'onnx-community/mobilenetv4_conv_small.e2400_r224_in1k',
    name: 'Fast (10MB)',
    size: '10MB',
    description: 'Fastest download, good for quick scans'
  },
  small: {
    id: 'onnx-community/mobilenetv3_small_100.lamb_in1k',
    name: 'Balanced (15MB)',
    size: '15MB',
    description: 'Good balance of speed and accuracy'
  },
  medium: {
    id: 'Xenova/mobilevit-small',
    name: 'Accurate (80MB)',
    size: '80MB',
    description: 'Better accuracy for detailed analysis'
  },
  full: {
    id: 'Xenova/vit-base-patch16-224',
    name: 'Best Quality (350MB)',
    size: '350MB',
    description: 'Highest accuracy, requires more download time'
  }
} as const;

export type ModelSize = keyof typeof MODEL_OPTIONS;

const MODEL_CACHE_KEY = 'farmcare-pest-model-cached';
const MODEL_SIZE_KEY = 'farmcare-pest-model-size';

// Get currently selected model size
export function getSelectedModelSize(): ModelSize {
  try {
    const saved = localStorage.getItem(MODEL_SIZE_KEY);
    if (saved && saved in MODEL_OPTIONS) {
      return saved as ModelSize;
    }
  } catch {}
  return 'tiny'; // Default to smallest model
}

// Set selected model size
export function setSelectedModelSize(size: ModelSize): void {
  try {
    localStorage.setItem(MODEL_SIZE_KEY, size);
    // Clear cached status when changing model
    localStorage.removeItem(MODEL_CACHE_KEY);
    // Reset pipeline so new model loads on next use
    classifierPipeline = null;
  } catch {}
}

// Check if model is already cached
export function isModelCached(): boolean {
  try {
    const cachedSize = localStorage.getItem(MODEL_CACHE_KEY);
    const selectedSize = getSelectedModelSize();
    return cachedSize === selectedSize;
  } catch {
    return false;
  }
}

// Mark model as cached
function markModelCached(): void {
  try {
    localStorage.setItem(MODEL_CACHE_KEY, getSelectedModelSize());
  } catch {
    console.warn('Could not save cache status to localStorage');
  }
}

const MAX_IMAGE_DIMENSION = 512;

let classifierPipeline: any = null;
let isLoading = false;
let currentLoadedModel: ModelSize | null = null;

// Known pest-related labels mapping
const PEST_KEYWORDS = [
  'caterpillar', 'worm', 'larva', 'insect', 'beetle', 'moth', 'butterfly',
  'grasshopper', 'locust', 'aphid', 'mite', 'spider', 'ant', 'weevil',
  'bug', 'pest', 'maggot', 'grub', 'cricket', 'fly', 'wasp', 'bee'
];

export interface BrowserDetectionResult {
  isPest: boolean;
  confidence: number;
  labels: { label: string; score: number }[];
  infestationLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  pestTypes: string[];
  processingTime: number;
}

// Initialize the classifier (can be called early to pre-load)
export async function initializePestDetector(onProgress?: (progress: number) => void): Promise<boolean> {
  const selectedSize = getSelectedModelSize();
  
  // If already loaded with same model, return true
  if (classifierPipeline && currentLoadedModel === selectedSize) return true;
  if (isLoading) return false;
  
  isLoading = true;
  
  // Reset pipeline if switching models
  if (currentLoadedModel !== selectedSize) {
    classifierPipeline = null;
  }
  
  const modelId = MODEL_OPTIONS[selectedSize].id;
  
  try {
    console.log(`Initializing pest detection model: ${modelId}`);
    
    // Use WebGPU for better performance
    classifierPipeline = await pipeline(
      'image-classification',
      modelId,
      { 
        device: 'webgpu',
        progress_callback: (data: any) => {
          if (data.progress && onProgress) {
            onProgress(Math.round(data.progress));
          }
        }
      }
    );
    
    console.log('Pest detection model loaded successfully');
    currentLoadedModel = selectedSize;
    markModelCached();
    isLoading = false;
    return true;
  } catch (error) {
    console.error('Failed to load WebGPU model, trying WASM fallback:', error);
    
    try {
      // Fallback to WASM if WebGPU not available
      classifierPipeline = await pipeline(
        'image-classification',
        modelId,
        { 
          device: 'wasm',
          progress_callback: (data: any) => {
            if (data.progress && onProgress) {
              onProgress(Math.round(data.progress));
            }
          }
        }
      );
      console.log('Pest detection model loaded with WASM fallback');
      currentLoadedModel = selectedSize;
      markModelCached();
      isLoading = false;
      return true;
    } catch (wasmError) {
      console.error('Failed to load model:', wasmError);
      isLoading = false;
      return false;
    }
  }
}

// Download and cache model manually (for one-time download button)
export async function downloadAndCacheModel(onProgress?: (progress: number) => void): Promise<boolean> {
  const selectedSize = getSelectedModelSize();
  
  if (classifierPipeline && currentLoadedModel === selectedSize) {
    markModelCached();
    return true;
  }
  
  return initializePestDetector(onProgress);
}

// Resize image if needed for faster processing
function resizeImage(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
}

// Load image from file or URL
export function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

// Analyze labels to determine if pest-related
function analyzePestLabels(labels: { label: string; score: number }[]): {
  isPest: boolean;
  pestTypes: string[];
  confidence: number;
} {
  const pestTypes: string[] = [];
  let maxPestScore = 0;
  
  for (const { label, score } of labels) {
    const lowerLabel = label.toLowerCase();
    
    // Check if label contains any pest-related keywords
    for (const keyword of PEST_KEYWORDS) {
      if (lowerLabel.includes(keyword)) {
        if (!pestTypes.includes(label)) {
          pestTypes.push(label);
        }
        if (score > maxPestScore) {
          maxPestScore = score;
        }
        break;
      }
    }
    
    // Special case: Fall Armyworm detection
    if (lowerLabel.includes('caterpillar') || lowerLabel.includes('larva') || lowerLabel.includes('worm')) {
      if (!pestTypes.includes('Fall Armyworm (suspected)')) {
        pestTypes.push('Fall Armyworm (suspected)');
      }
    }
  }
  
  return {
    isPest: pestTypes.length > 0 || maxPestScore > 0.3,
    pestTypes: pestTypes.length > 0 ? pestTypes : ['Unknown pest'],
    confidence: maxPestScore * 100
  };
}

// Determine infestation level based on confidence
function determineInfestationLevel(isPest: boolean, confidence: number): BrowserDetectionResult['infestationLevel'] {
  if (!isPest) return 'none';
  if (confidence >= 80) return 'critical';
  if (confidence >= 60) return 'high';
  if (confidence >= 40) return 'moderate';
  return 'low';
}

// Main detection function
export async function detectPestInBrowser(
  imageSource: File | string | HTMLImageElement,
  onProgress?: (status: string) => void
): Promise<BrowserDetectionResult> {
  const startTime = performance.now();
  
  try {
    // Initialize model if not ready
    if (!classifierPipeline || currentLoadedModel !== getSelectedModelSize()) {
      onProgress?.('Loading AI model...');
      const initialized = await initializePestDetector();
      if (!initialized) {
        throw new Error('Failed to initialize pest detection model');
      }
    }
    
    onProgress?.('Processing image...');
    
    // Load image if needed
    let image: HTMLImageElement;
    if (imageSource instanceof HTMLImageElement) {
      image = imageSource;
    } else {
      image = await loadImage(imageSource);
    }
    
    // Create canvas and resize
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    resizeImage(canvas, ctx, image);
    
    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    onProgress?.('Analyzing for pests...');
    
    // Run classification
    const results = await classifierPipeline(imageData, { topk: 10 });
    
    console.log('Classification results:', results);
    
    // Analyze results for pests
    const { isPest, pestTypes, confidence } = analyzePestLabels(results);
    const infestationLevel = determineInfestationLevel(isPest, confidence);
    
    const processingTime = performance.now() - startTime;
    
    return {
      isPest,
      confidence,
      labels: results,
      infestationLevel,
      pestTypes,
      processingTime
    };
  } catch (error) {
    console.error('Browser pest detection error:', error);
    throw error;
  }
}

// Check if browser supports WebGPU
export async function checkWebGPUSupport(): Promise<boolean> {
  try {
    // @ts-ignore - WebGPU types may not be available
    if (!navigator.gpu) {
      return false;
    }
    // @ts-ignore
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}