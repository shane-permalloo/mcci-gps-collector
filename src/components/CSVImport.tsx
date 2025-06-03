import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Play, RotateCcw, Loader2, Wifi, WifiOff } from "lucide-react";
import { parseCSV, convertCSVToDirectusRecords, batchUpdateDirectusRecords, testDirectusConnection, DirectusShopRecord, BatchUpdateResult } from "../utils/csvImportUtils";

const CSVImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<DirectusShopRecord[]>([]);
  const [batchResults, setBatchResults] = useState<BatchUpdateResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentRecord, setCurrentRecord] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test Directus connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testDirectusConnection();
      setConnectionStatus(isConnected ? "connected" : "disconnected");
    };
    checkConnection();
  }, []);

  const isValidCSVFile = (file: File): boolean => {
    // Check file extension - this is the most reliable check
    const fileName = file.name.toLowerCase();
    const hasCSVExtension = fileName.endsWith(".csv");

    // console.log("File validation:", {
    //   name: fileName,
    //   type: file.type,
    //   hasCSVExtension,
    //   size: file.size,
    // });

    // For CSV files, we'll primarily rely on the file extension
    // since MIME types can be inconsistent across browsers and systems
    return hasCSVExtension;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // console.log("handleFileSelect called");
    const selectedFile = event.target.files?.[0];
    // console.log("Selected file:", selectedFile);

    if (selectedFile) {
      // console.log("File details:", {
      //   name: selectedFile.name,
      //   type: selectedFile.type,
      //   size: selectedFile.size,
      // });

      if (isValidCSVFile(selectedFile)) {
        //console.log("File is valid, setting file state");
        setFile(selectedFile);
        setErrorMessage("");
      } else {
        // console.log("File is invalid");
        setErrorMessage(`Invalid file: "${selectedFile.name}". Please select a CSV file with .csv extension.`);
        setFile(null);
      }
    } else {
      // console.log("No file selected");
      setErrorMessage("No file selected");
      setFile(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      if (isValidCSVFile(droppedFile)) {
        setFile(droppedFile);
        setErrorMessage("");
      } else {
        setErrorMessage(`Invalid file: "${droppedFile.name}". Please drop a CSV file with .csv extension.`);
        setFile(null);
      }
    } else {
      setErrorMessage("No file dropped");
      setFile(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const csvContent = await file.text();
      const csvRows = parseCSV(csvContent);
      const records = convertCSVToDirectusRecords(csvRows);
      setParsedData(records);
    } catch (error) {
      setErrorMessage(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const startBatchUpdate = async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setBatchResults([]);
    setErrorMessage("");

    try {
      const results = await batchUpdateDirectusRecords(parsedData, (progress, currentResult) => {
        setUploadProgress(progress);
        setCurrentRecord(currentResult.record.shop_name);
        setBatchResults((prev) => [...prev.filter((r) => r.id !== currentResult.id), currentResult]);
      });

      setBatchResults(results);
    } catch (error) {
      setErrorMessage(`Batch update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setCurrentRecord("");
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData([]);
    setBatchResults([]);
    setUploadProgress(0);
    setCurrentRecord("");
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Computed values
  const validRecords = parsedData.filter((record) => record.validation_status === "valid");
  const invalidRecords = parsedData.filter((record) => record.validation_status === "invalid");
  const warningRecords = parsedData.filter((record) => record.validation_status === "warning");

  return (
    <div className="max-w-8xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header with Connection Status */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Upload className="mr-3" size={24} />
            CSV Import
          </h2>
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <div className="flex items-center text-green-600 dark:text-green-400 animate-pulse">
                <Wifi size={16} className="mr-1" />
                <span className="text-sm">Connected</span>
              </div>
            ) : connectionStatus === "disconnected" ? (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <WifiOff size={16} className="mr-1" />
                <span className="text-sm">Disconnected</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <Loader2 size={16} className="mr-1 animate-spin" />
                <span className="text-sm">Checking...</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center">
          <span className="px-2 py-1 font-medium text-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md mr-2">1</span> Generate a new CSV file from the "Export" button
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center">
          <span className="px-2 py-1 font-medium text-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md mr-2">2</span> Modify the shopID in the CSV file. Replace "XXX" with actual shop IDs before importing. (Please make a careful verification on the MCCI Shopping Route Back-Office, cross-checking the name
          of the shop, together with the name of the mall if required)
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex items-center">
          <span className="px-2 py-1 font-medium text-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md mr-2">3</span> Once the CSV is properly filled, upload it to batch update shop location coordinates in the MCCI Shopping Route Back-Office. The system will only update the shop_location.coordinates
          field and will not modify neither the shop_malls nor the shop_name.
        </p>
        <p className="text-sm px-2 py-3 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 mb-4">
          <strong>Note:</strong> Expected CSV format: id, shop_name, shop_malls, shop_location.type, shop_location.coordinates
          <br />
          {/* <strong>Configuration:</strong> {DIRECTUS_CONFIG.baseUrl} → https://preprodshoppingroute.etrs.mu (via proxy) */}
        </p>

        {/* File Upload Section */}
        <div className="mb-6">
          <div
            className={`border border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-all duration-300 transform ${
              isDragging ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}>
            <div className={`transition-transform duration-300`}>
              <FileText className={`mx-auto mb-4 transition-colors duration-300 ${isDragging ? "text-blue-500" : "text-gray-400"}`} size={48} />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Supports CSV files with shop location data</p>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv,application/csv,text/plain" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 transform shadow-lg hover:shadow-xl">
                Select File
              </button>
            </div>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Selected: {file.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">Size: {(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={processFile}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md transition-all duration-300 transform">
                  {isProcessing ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Processing...
                    </div>
                  ) : (
                    "Process File"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="mr-2 text-red-600 dark:text-red-400" size={20} />
              <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {parsedData.length > 0 && (
          <div className="mb-6 animate-slideIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Preview</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transform transition-transform">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 text-green-600 dark:text-green-400" size={20} />
                  <div>
                    <span className="font-medium text-green-800 dark:text-green-200 block">Valid Records</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">{validRecords.length}</span>
                  </div>
                </div>
              </div>

              {warningRecords.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg transform">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 text-yellow-600 dark:text-yellow-400" size={20} />
                    <div>
                      <span className="font-medium text-yellow-800 dark:text-yellow-200 block">Warnings</span>
                      <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningRecords.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {invalidRecords.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transform">
                  <div className="flex items-center">
                    <AlertCircle className="mr-2 text-red-600 dark:text-red-400" size={20} />
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200 block">Invalid Records</span>
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">{invalidRecords.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Uploading to MCCI Shopping Route Back-Office...</span>
                  <span className="text-sm text-blue-600 dark:text-blue-300">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                {currentRecord && <p className="text-xs text-blue-600 dark:text-blue-300">Processing: {currentRecord}</p>}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={startBatchUpdate}
                disabled={isUploading || validRecords.length === 0 || connectionStatus !== "connected"}
                className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 transform shadow-lg hover:shadow-xl">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Play className="mr-2" size={18} />
                    Start Batch Update ({validRecords.length} records)
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                disabled={isUploading}
                className="flex items-center px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-all duration-300 transform">
                <RotateCcw className="mr-2" size={16} />
                Reset
              </button>
            </div>

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Batch Update Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {batchResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border transition-all duration-300 ${
                        result.status === "success"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : result.status === "error"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                          : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.status === "success" ? (
                            <CheckCircle className="mr-2 text-green-600 dark:text-green-400" size={16} />
                          ) : result.status === "error" ? (
                            <AlertCircle className="mr-2 text-red-600 dark:text-red-400" size={16} />
                          ) : (
                            <Loader2 className="mr-2 animate-spin text-gray-500" size={16} />
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium dark:text-gray-100 text-gray-700">{result.record.shop_name}</span>
                            {result.status === "error" && result.message.includes("not found") && (
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Invalid ID: {result.record.id}</span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            result.status === "success"
                              ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
                              : result.status === "error"
                              ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          }`}>
                          {result.status}
                        </span>
                      </div>
                      {result.message && (
                        <p
                          className={`text-xs mt-1 ${
                            result.status === "error" && result.message.includes("not found") ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400"
                          }`}>
                          {result.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImport;
