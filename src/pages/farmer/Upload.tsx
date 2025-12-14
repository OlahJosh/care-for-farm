import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload as UploadIcon, Camera, Plane, Video, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to create alerts for high/medium infestations
const createAlertIfNeeded = async (reportId: string, scanType: string) => {
  try {
    const { data: report, error: reportError } = await supabase
      .from('analysis_reports')
      .select('infestation_level, farm_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('Error fetching report:', reportError);
      return;
    }

    if (report.infestation_level === 'HIGH' || report.infestation_level === 'MEDIUM') {
      const scanTypeLabel = scanType === 'spot_check' ? 'Spot Check' : scanType === 'drone_flight' ? 'Drone Scan' : 'Live Scan';
      
      const { error: alertError } = await supabase
        .from('alerts')
        .insert({
          farm_id: report.farm_id,
          alert_type: 'Pest Detection Alert',
          severity: report.infestation_level === 'HIGH' ? 'critical' : 'high',
          message: `A ${report.infestation_level} infestation level was found in your recent ${scanTypeLabel}. Check report for details.`,
          type: 'pest',
          priority: 1,
          is_read: false
        });

      if (alertError) {
        console.error('Error creating alert:', alertError);
      } else if (report.infestation_level === 'HIGH') {
        toast.info('SMS notification triggered via n8n workflow.', {
          duration: 5000,
        });
      }
    }
  } catch (error) {
    console.error('Error in createAlertIfNeeded:', error);
  }
};

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [spotCheckFiles, setSpotCheckFiles] = useState<File[]>([]);
  const [droneFiles, setDroneFiles] = useState<File[]>([]);
  const [spotCheckLoading, setSpotCheckLoading] = useState(false);
  const [droneLoading, setDroneLoading] = useState(false);
  const [spotCheckPreviews, setSpotCheckPreviews] = useState<string[]>([]);
  const [dronePreviews, setDronePreviews] = useState<string[]>([]);
  
  // Live Scan state
  const [liveScanActive, setLiveScanActive] = useState(false);
  const [liveScanLoading, setLiveScanLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const spotCheckInputRef = useRef<HTMLInputElement | null>(null);
  const droneInputRef = useRef<HTMLInputElement | null>(null);

  // Remove a file from spot check
  const removeSpotCheckFile = (index: number) => {
    URL.revokeObjectURL(spotCheckPreviews[index]);
    setSpotCheckFiles(prev => prev.filter((_, i) => i !== index));
    setSpotCheckPreviews(prev => prev.filter((_, i) => i !== index));
    // Reset file input
    if (spotCheckInputRef.current) {
      spotCheckInputRef.current.value = '';
    }
  };

  // Remove a file from drone files
  const removeDroneFile = (index: number) => {
    URL.revokeObjectURL(dronePreviews[index]);
    setDroneFiles(prev => prev.filter((_, i) => i !== index));
    setDronePreviews(prev => prev.filter((_, i) => i !== index));
    // Reset file input
    if (droneInputRef.current) {
      droneInputRef.current.value = '';
    }
  };

  // Live Scan functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      setLiveScanActive(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!videoRef.current) {
        throw new Error('Video element not available after render');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000);
        
        videoElement.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve();
        };
      });
      
      await videoElement.play();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        throw new Error('Video dimensions are invalid');
      }
      
      toast.success("Camera ready");
    } catch (error) {
      setLiveScanActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setCameraError(`Camera initialization failed: ${errorMessage}`);
      toast.error("Failed to start camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setLiveScanActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;

    setLiveScanLoading(true);
    try {
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        throw new Error('Video stream not ready. Please wait a moment and try again.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(videoRef.current, 0, 0);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to convert frame to image'));
        }, 'image/jpeg', 0.95);
      });

      const file = new File([blob], `live-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const fileExt = 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('crop-scans')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('crop-scans')
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke('detect-pest', {
        body: { 
          imageUrl: publicUrl,
          scanType: 'live_scan'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Detection complete! Found ${data.detectionsCount || data.detections?.length || 0} pest(s)`);
      await createAlertIfNeeded(data.reportId, 'live_scan');
      
      stopCamera();
      navigate(`/farmer/report/${data.reportId}`);
    } catch (error) {
      console.error('Error during live scan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze frame');
    } finally {
      setLiveScanLoading(false);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      recordedChunksRef.current = [];
      setRecordingDuration(0);
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        await uploadRecordedVideo();
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started");
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setLiveScanLoading(true);
      toast.info("Processing video...");
    }
  };

  const uploadRecordedVideo = async () => {
    try {
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const videoFile = new File([videoBlob], `live-scan-${Date.now()}.webm`, { type: 'video/webm' });

      const fileName = `${Math.random()}.webm`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('crop-scans')
        .upload(filePath, videoFile);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('crop-scans')
        .getPublicUrl(filePath);

      const { data, error } = await supabase.functions.invoke('detect-pest', {
        body: { 
          imageUrl: publicUrl,
          scanType: 'live_scan'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Detection complete! Found ${data.detectionsCount || data.detections?.length || 0} pest(s)`);
      await createAlertIfNeeded(data.reportId, 'live_scan');
      
      stopCamera();
      navigate(`/farmer/report/${data.reportId}`);
    } catch (error) {
      console.error('Error uploading recorded video:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze video');
    } finally {
      setLiveScanLoading(false);
      recordedChunksRef.current = [];
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      stopCamera();
    };
  }, []);

  const handleSpotCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (spotCheckFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setSpotCheckLoading(true);
    
    try {
      toast.info(`Processing ${spotCheckFiles.length} file(s)...`);
      const reportIds: string[] = [];
      
      for (let i = 0; i < spotCheckFiles.length; i++) {
        const file = spotCheckFiles[i];
        toast.info(`Processing file ${i + 1} of ${spotCheckFiles.length}...`);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('crop-scans')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('crop-scans')
          .getPublicUrl(filePath);

        const { data, error } = await supabase.functions.invoke('detect-pest', {
          body: { 
            imageUrl: publicUrl,
            scanType: 'spot_check'
          }
        });

        if (error) {
          throw new Error(`Detection failed for ${file.name}: ${error.message}`);
        }

        reportIds.push(data.reportId);
        await createAlertIfNeeded(data.reportId, 'spot_check');
      }

      toast.success(`All ${spotCheckFiles.length} file(s) processed successfully!`);
      navigate(`/farmer/report/${reportIds[0]}`);
    } catch (error) {
      console.error('Error during spot check:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze images');
    } finally {
      setSpotCheckLoading(false);
    }
  };

  const handleDroneFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (droneFiles.length === 0) {
      toast.error("Please select at least one image or video");
      return;
    }

    setDroneLoading(true);
    
    try {
      toast.info(`Processing ${droneFiles.length} file(s)...`);
      const reportIds: string[] = [];
      
      for (let i = 0; i < droneFiles.length; i++) {
        const file = droneFiles[i];
        toast.info(`Processing file ${i + 1} of ${droneFiles.length}...`);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('crop-scans')
          .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('crop-scans')
          .getPublicUrl(filePath);

        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
          toast.info('Processing video... This may take up to 5 minutes for longer videos.');
        }
        
        const { data, error } = await supabase.functions.invoke('detect-pest', {
          body: { 
            imageUrl: publicUrl,
            scanType: 'drone_flight'
          }
        });

        if (error) {
          throw new Error(`Detection failed for ${file.name}: ${error.message}`);
        }

        if (!data) {
          throw new Error('No data received from detection service');
        }

        reportIds.push(data.reportId);
        await createAlertIfNeeded(data.reportId, 'drone_flight');
      }

      toast.success(`All ${droneFiles.length} file(s) processed successfully!`);
      navigate(`/farmer/report/${reportIds[0]}`);
    } catch (error) {
      console.error('Error during drone flight analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze files';
      toast.error(errorMessage);
    } finally {
      setDroneLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Scan for Pests</h1>
        
        {/* Live Scan Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Live Scan (Real-time Monitoring)</CardTitle>
                <CardDescription>Use your device camera for instant crop health analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!liveScanActive ? (
              <div className="flex flex-col items-center justify-center py-8">
                {cameraError ? (
                  <div className="text-center mb-4">
                    <p className="text-destructive mb-4">{cameraError}</p>
                    <Button onClick={startCamera} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <Button onClick={startCamera} size="lg">
                    <Camera className="mr-2 h-5 w-5" />
                    Start Camera
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-medium">
                        Recording {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button 
                    onClick={captureFrame} 
                    disabled={liveScanLoading || isRecording}
                    size="lg"
                    variant="outline"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {liveScanLoading ? "Analyzing..." : "Capture Frame"}
                  </Button>
                  {!isRecording ? (
                    <Button 
                      onClick={startRecording} 
                      disabled={liveScanLoading}
                      size="lg"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopRecording} 
                      disabled={liveScanLoading}
                      size="lg"
                      variant="destructive"
                    >
                      Stop Recording
                    </Button>
                  )}
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    disabled={liveScanLoading || isRecording}
                  >
                    Stop Camera
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Camera className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Spot Check (Quick Scan)</CardTitle>
                  <CardDescription>Upload one or more images/videos for instant analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSpotCheck} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Upload Images/Videos (Multiple)
                  </label>
                  <Input
                    ref={spotCheckInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSpotCheckFiles(prev => [...prev, ...files]);
                      const previews = files.map(file => URL.createObjectURL(file));
                      setSpotCheckPreviews(prev => [...prev, ...previews]);
                    }}
                    disabled={spotCheckLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, WEBP, MP4, AVI, MOV (Multiple files allowed)
                  </p>
                </div>
                
                {spotCheckFiles.length > 0 && (
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Selected {spotCheckFiles.length} file(s):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {spotCheckFiles.map((file, index) => (
                        <div key={index} className="relative space-y-1 group">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSpotCheckFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-xs text-muted-foreground truncate pr-6">{file.name}</p>
                          {file.type.startsWith('image/') ? (
                            <img src={spotCheckPreviews[index]} alt={`Preview ${index + 1}`} className="w-full rounded-md" />
                          ) : (
                            <video src={spotCheckPreviews[index]} controls className="w-full rounded-md" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={spotCheckLoading || spotCheckFiles.length === 0}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {spotCheckLoading ? "Analyzing..." : `Upload ${spotCheckFiles.length || ''} File(s)`}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Plane className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Drone Flight (Deep Scan)</CardTitle>
                  <CardDescription>Upload one or more high-resolution drone images/videos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDroneFlight} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Upload High-Resolution Images/Videos (Multiple)
                  </label>
                  <Input
                    ref={droneInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setDroneFiles(prev => [...prev, ...files]);
                      const previews = files.map(file => URL.createObjectURL(file));
                      setDronePreviews(prev => [...prev, ...previews]);
                    }}
                    disabled={droneLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, WEBP, MP4, AVI, MOV (Multiple files allowed)
                  </p>
                </div>
                
                {droneFiles.length > 0 && (
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Selected {droneFiles.length} file(s):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {droneFiles.map((file, index) => (
                        <div key={index} className="relative space-y-1 group">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeDroneFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-xs text-muted-foreground truncate pr-6">{file.name}</p>
                          {file.type.startsWith('image/') ? (
                            <img src={dronePreviews[index]} alt={`Preview ${index + 1}`} className="w-full rounded-md" />
                          ) : (
                            <video src={dronePreviews[index]} controls className="w-full rounded-md" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={droneLoading || droneFiles.length === 0}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {droneLoading ? "Processing..." : `Upload ${droneFiles.length || ''} File(s)`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Spot Check</h3>
              <p className="text-sm text-muted-foreground">
                Perfect for quick inspections. Snap a photo with your phone camera and get instant 
                pest detection results with bounding boxes and confidence scores.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Drone Flight</h3>
              <p className="text-sm text-muted-foreground">
                For comprehensive field analysis. Upload high-resolution aerial imagery or drone footage to detect 
                pest infestations across large areas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Upload;
