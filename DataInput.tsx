import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Key, Server } from 'lucide-react';
import { FileInput } from './types';

interface DataInputProps {
  onAnalyze: (text: string, files: File[], apiKey: string, baseUrl?: string) => void;
  isProcessing: boolean;
}

const DataInput: React.FC<DataInputProps> = ({ onAnalyze, isProcessing }) => {
  const defaultApiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
  const defaultBaseUrl = (import.meta as any).env?.VITE_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://new.fastaicode.top';
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileInput[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileInput[] = (Array.from(e.target.files) as File[]).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'text'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = () => {
    if (!text && files.length === 0) return;
    onAnalyze(text, files.map(f => f.file), apiKey, baseUrl);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-brand-600" />
        输入资料
      </h2>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
        
        {/* Connection Settings */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col gap-3">
          
          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-blue-800 mb-1">
              OpenAI API Key (必填)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-blue-500" />
              </div>
              <input
                type="password"
                className="block w-full pl-9 pr-3 py-2 border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          {/* Base URL Input */}
          <div>
            <label className="block text-xs font-semibold text-blue-800 mb-1">
              请求地址 (可选)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Server className="h-4 w-4 text-blue-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-9 pr-3 py-2 border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                placeholder="https://new.fastaicode.top"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-blue-600 opacity-80">
              默认使用 ChatGPT gpt-5.4，可填写兼容 OpenAI 的代理地址
            </p>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文本内容 / Word 内容粘贴
          </label>
          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none text-sm"
            placeholder="在此粘贴题目文本..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图片上传 (支持多图)
          </label>
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-brand-50 hover:border-brand-300 transition-colors"
            >
              <div className="text-center">
                <div className="mx-auto h-10 w-10 text-gray-400 mb-2">
                   <ImageIcon className="w-full h-full"/>
                </div>
                <p className="text-sm text-gray-500">点击上传考题截图或照片</p>
              </div>
            </label>
          </div>
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {files.map((file, index) => (
              <div key={index} className="relative group border rounded-lg p-2 bg-gray-50">
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                {file.type === 'image' ? (
                  <div className="aspect-video w-full overflow-hidden rounded bg-gray-200">
                    <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 bg-gray-100 rounded">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1 truncate">{file.file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !apiKey || (!text && files.length === 0)}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all
            ${isProcessing || !apiKey || (!text && files.length === 0)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-lg'
            }`}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI 解析中...
            </>
          ) : (
            '开始识别提取'
          )}
        </button>
      </div>
    </div>
  );
};

export default DataInput;
