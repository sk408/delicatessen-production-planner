import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAppStore } from '@/store/app-store';
import { useNotifications } from '@components/common/NotificationProvider';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { CsvProcessor } from '@lib/csv-parser';
import { formatFileSize } from '@utils/format-helpers';
import type { UploadedFile } from '@types/index';

export function DataUploadPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotifications();
  
  const {
    uploadedFiles,
    addUploadedFile,
    updateUploadedFile,
    removeUploadedFile,
    addProcessedData,
    setDataStatus,
    setActiveStep
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const csvProcessor = new CsvProcessor();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setDataStatus('uploading');

    try {
      for (const file of acceptedFiles) {
        // Create uploaded file record
        const uploadedFile: UploadedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          uploadedAt: new Date(),
          status: 'processing'
        };

        addUploadedFile(uploadedFile);

        try {
          // Process the CSV file
          const result = await csvProcessor.processFile(file);

          if (result.success) {
            // Update file status
            updateUploadedFile(uploadedFile.id, {
              status: 'processed',
              recordCount: result.data.length,
              dateRange: result.metadata.dateRange,
              metadata: result.metadata
            });

            // Add processed data to store
            addProcessedData(result.data);

            showSuccess(`Successfully processed ${file.name} - ${result.data.length} records`);
          } else {
            // Update file with errors
            updateUploadedFile(uploadedFile.id, {
              status: 'error',
              errors: result.errors
            });

            showError(`Failed to process ${file.name}: ${result.errors[0]?.message || 'Unknown error'}`);
          }
        } catch (error) {
          updateUploadedFile(uploadedFile.id, {
            status: 'error',
            errors: [{
              row: 0,
              column: 'file',
              value: file.name,
              expected: 'valid CSV file',
              message: error instanceof Error ? error.message : 'Unknown error'
            }]
          });

          showError(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setDataStatus('ready');
      
    } catch (error) {
      setDataStatus('error');
      showError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [addUploadedFile, updateUploadedFile, addProcessedData, setDataStatus, showSuccess, showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: true,
    disabled: isProcessing
  });

  const handleRemoveFile = (fileId: string) => {
    removeUploadedFile(fileId);
    if (uploadedFiles.length <= 1) {
      setDataStatus('idle');
    }
  };

  const handleContinue = () => {
    setActiveStep(2);
    navigate('/configure');
  };

  const processedFiles = uploadedFiles.filter(file => file.status === 'processed');
  const hasProcessedFiles = processedFiles.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Sales Data
        </h1>
        <p className="text-lg text-gray-600">
          Import CSV files containing your sales data to begin production planning
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer',
            isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400',
            isProcessing && 'pointer-events-none opacity-50'
          )}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <LoadingSpinner size="large" message="Processing files..." />
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop CSV files here...' : 'Upload CSV Files'}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your CSV files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports multiple files for multi-year analysis
              </p>
              <button className="mt-4 btn-primary">
                Select Files
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expected format info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Expected CSV Format:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Required columns:</strong> Dept Num, Fiscal Year, Member Net Sales Units, Member Net Sales Units LY, Item, Fiscal Period, Fiscal Week, Fiscal Day</p>
          <p>• <strong>Item format:</strong> "12345 ITEM DESCRIPTION"</p>
          <p>• <strong>Fiscal Year:</strong> 2025 (for FY2025 starting Sept 2, 2024)</p>
          <p>• <strong>Multiple files:</strong> Upload files from different years for trend analysis</p>
        </div>
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Files ({uploadedFiles.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      {file.recordCount && (
                        <span>{file.recordCount.toLocaleString()} records</span>
                      )}
                      {file.dateRange && (
                        <span>
                          {file.dateRange.start.toLocaleDateString()} - {file.dateRange.end.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Status indicator */}
                  {file.status === 'processed' && (
                    <CheckCircleIcon className="h-5 w-5 text-success-500" />
                  )}
                  {file.status === 'error' && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-error-500" />
                  )}
                  {file.status === 'processing' && (
                    <LoadingSpinner size="small" />
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                    disabled={isProcessing}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error details */}
      {uploadedFiles.some(file => file.errors && file.errors.length > 0) && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <h4 className="font-medium text-error-900 mb-3">Processing Errors:</h4>
          <div className="space-y-2">
            {uploadedFiles
              .filter(file => file.errors && file.errors.length > 0)
              .map(file => (
                <div key={file.id} className="text-sm">
                  <p className="font-medium text-error-800">{file.name}:</p>
                  <ul className="ml-4 text-error-700 space-y-1">
                    {file.errors?.slice(0, 3).map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                    {file.errors && file.errors.length > 3 && (
                      <li>• ... and {file.errors.length - 3} more errors</li>
                    )}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      {hasProcessedFiles && (
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            className="btn-primary px-8 py-3 text-lg"
            disabled={isProcessing}
          >
            Continue to Configuration
          </button>
        </div>
      )}

      {/* Help section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">Need Help?</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• <strong>File not processing?</strong> Check that your CSV has the required columns and proper formatting</p>
          <p>• <strong>Missing data?</strong> Ensure fiscal dates are within expected ranges (FY2024-2026)</p>
          <p>• <strong>Multiple years?</strong> Upload separate files for each year to enable trend analysis</p>
          <p>• <strong>Large files?</strong> Files up to 50MB are supported - larger files may take longer to process</p>
        </div>
      </div>
    </div>
  );
}
