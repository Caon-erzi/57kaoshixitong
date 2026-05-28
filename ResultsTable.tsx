import React, { useState } from 'react';
import { Download, Table as TableIcon, Copy, FileText } from 'lucide-react';
import { ExamQuestion, ExamConfig, WordHeaderConfig } from './types';
import saveAs from "file-saver";

interface ResultsTableProps {
  data: ExamQuestion[];
  config?: ExamConfig;
  headerConfig?: WordHeaderConfig;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, config, headerConfig }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mb-4">
          <TableIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">等待数据</h3>
        <p className="text-gray-500 max-w-sm">
          请在左侧上传图片或粘贴文本，点击"开始识别提取"生成试题表格。
        </p>
      </div>
    );
  }

  // Helper to filter data based on configuration limits
  const getFilteredData = () => {
    if (!config) return data;
    
    const filtered: ExamQuestion[] = [];
    const grouped: Record<string, ExamQuestion[]> = {
        '判断题': [],
        '单选题': [],
        '多选题': [],
        '简答题': [],
    };

    // Group first
    data.forEach(q => {
        let type = '其他';
        if (q.questionType.includes('判断')) type = '判断题';
        else if (q.questionType.includes('单选')) type = '单选题';
        else if (q.questionType.includes('多选')) type = '多选题';
        else if (q.questionType.includes('简答')) type = '简答题';
        
        if (grouped[type]) grouped[type].push(q);
        else filtered.push(q); // Push unknown types directly
    });

    // Apply limits
    const appendLimited = (type: string, limit: number) => {
        if (grouped[type]) {
            filtered.push(...grouped[type].slice(0, limit));
        }
    };

    appendLimited('判断题', config.judgment.count);
    appendLimited('单选题', config.single.count);
    appendLimited('多选题', config.multi.count);
    appendLimited('简答题', config.short.count);

    return filtered;
  };

  const copyToClipboard = () => {
    // Simple TSV copy for Excel pasting
    const exportData = getFilteredData();
    const headers = [
      '考题类型名称', '考题适用类型名称(多选)', '题目', '题目文件地址',
      '考题选项A', '考题选项B', '考题选项C', '考题选项D', '考题选项E', '考题选项F', '标准答案'
    ];
    
    const rows = exportData.map(q => [
      q.questionType, "生产保障", q.questionTitle, q.fileUrl,
      q.optionA, q.optionB, q.optionC, q.optionD, q.optionE, q.optionF, q.answer
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      alert(`已复制 ${exportData.length} 条试题到剪贴板，可直接粘贴到 Excel`);
    });
  };

  const downloadCSV = () => {
    const exportData = getFilteredData();
    const headers = [
        '考题类型名称', '考题适用类型名称(多选)', '题目', '题目文件地址',
        '考题选项A', '考题选项B', '考题选项C', '考题选项D', '考题选项E', '考题选项F', '标准答案'
    ];
    
    // Per requirement: "CSV中 考题适用类型名称为生产保障"
    const csvContent = "data:text/csv;charset=utf-8,\ufeff" 
        + [
            headers.join(','),
            ...exportData.map(q => [
                q.questionType, 
                "生产保障", // Hardcoded requirement
                q.questionTitle, 
                q.fileUrl,
                q.optionA, q.optionB, q.optionC, q.optionD, q.optionE, q.optionF, q.answer
            ].map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exam_questions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWord = async () => {
    setIsExporting(true);
    try {
      // Dynamic import docx here to ensure it loads only when needed and handles dependencies correctly
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = await import("docx");

      // Group questions by type order
      const order = ['判断题', '单选题', '多选题', '简答题'];
      
      const grouped: Record<string, ExamQuestion[]> = {};
      data.forEach(q => {
        // Normalize type names just in case
        let type = q.questionType || '其他题型';
        if (type.includes('单选')) type = '单选题';
        else if (type.includes('多选')) type = '多选题';
        else if (type.includes('判断')) type = '判断题';
        else if (type.includes('简答')) type = '简答题';
        
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(q);
      });

      const children = [];
      
      // Defaults if config is missing (should not happen in app)
      const mainTitle = headerConfig?.mainTitle || "部门级培训考核试题";
      const subTitle = headerConfig?.subTitle || "1月份培训阶段考核";
      const department = headerConfig?.department || "57车间";

      // --- Header Section (Customizable) ---
      children.push(
        new Paragraph({
          text: mainTitle,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: `部门： ${department}   岗位：__________  姓名：__________  成绩：__________  日期：__________` })
          ]
        }),
        new Paragraph({
          text: subTitle,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 400 }
        })
      );

      // --- Questions Section ---
      const typeMap = ['一', '二', '三', '四', '五', '六'];
      let sectionCounter = 0;

      for (const type of order) {
        if (!grouped[type]) continue;
        let questions = grouped[type];
        
        // Use Config if available
        let score = 0;
        let limit = questions.length;
        if (config) {
            if (type === '判断题') {
                score = config.judgment.score;
                limit = config.judgment.count;
            } else if (type === '单选题') {
                score = config.single.score;
                limit = config.single.count;
            } else if (type === '多选题') {
                score = config.multi.score;
                limit = config.multi.count;
            } else if (type === '简答题') {
                score = config.short.score;
                limit = config.short.count;
            }
            // Limit the questions based on user setting
            if (limit < questions.length) {
                questions = questions.slice(0, limit);
            }
        } else {
             // Fallback default scores
             if (type === '判断题') score = 2;
             else if (type === '单选题') score = 2;
             else if (type === '多选题') score = 6;
             else if (type === '简答题') score = 10;
        }

        if (questions.length === 0) continue;

        // Scoring text logic
        let scoreText = "";
        if (type === '判断题') scoreText = `(正确的划“√”，不正确的划“×”，每题 ${score} 分)`;
        else scoreText = `(每题 ${score} 分)`;

        // Section Header (e.g., 一、 判断题)
        children.push(
          new Paragraph({
            children: [
                new TextRun({ 
                    text: `${typeMap[sectionCounter]}、 ${type} ${scoreText}`,
                    bold: true,
                    size: 28 // 14pt
                })
            ],
            spacing: { before: 400, after: 200 }
          })
        );

        questions.forEach((q, index) => {
          // Question Title
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${q.questionTitle}` })
              ],
              spacing: { before: 200 }
            })
          );

          if (type === '判断题') {
             children.push(new Paragraph({ text: "（   ）", alignment: AlignmentType.RIGHT }));
          }
          else if (type === '简答题') {
             // Add blank space for short answers
             children.push(
                new Paragraph({ text: "" }), 
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" })
             );
          }
          else {
              // Options for Choice questions
              const options = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE, q.optionF].filter(o => o);
              if (options.length > 0) {
                options.forEach((opt, optIdx) => {
                   const label = String.fromCharCode(65 + optIdx); // A, B, C...
                   children.push(
                     new Paragraph({
                       text: `${label}. ${opt}`,
                       indent: { left: 720 }, // Visual indent
                       spacing: { before: 50 }
                     })
                   );
                });
              }
          }
        });
        sectionCounter++;
      }

      // --- Page Break ---
      children.push(
        new Paragraph({
          children: [new PageBreak()]
        })
      );

      // --- Answers Section (Separate Page) ---
      children.push(
        new Paragraph({
          text: "参考答案",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      for (const type of order) {
        if (!grouped[type]) continue;
        let questions = grouped[type];
         // Respect limit for answers too
        if (config) {
             let limit = questions.length;
             if (type === '判断题') limit = config.judgment.count;
             else if (type === '单选题') limit = config.single.count;
             else if (type === '多选题') limit = config.multi.count;
             else if (type === '简答题') limit = config.short.count;

             if (limit < questions.length) {
                questions = questions.slice(0, limit);
             }
        }
        if (questions.length === 0) continue;

        children.push(
          new Paragraph({
            text: type,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 }
          })
        );
        
        // Format answers nicely: 1. A  2. B  3. C ...
        const answerText = questions.map((q, i) => `${i + 1}.${q.answer || '无'}`).join('   ');
        
        children.push(
          new Paragraph({
            text: answerText,
            spacing: { after: 200 }
          })
        );
      }

      // Generate Document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      // Use dynamic filename
      saveAs(blob, `${department || '考试'}试题_带答案.docx`);

    } catch (e) {
      console.error("Export failed", e);
      alert("Word 导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TableIcon className="w-5 h-5 text-brand-600" />
          识别结果 ({data.length} 题)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-md transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 CSV
          </button>
           <button
            onClick={exportWord}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isExporting ? (
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <FileText className="w-4 h-4" />
            )}
            导出 Word
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 border-b border-r min-w-[100px] whitespace-nowrap">考题类型名称</th>
              <th className="p-3 border-b border-r min-w-[120px] whitespace-nowrap">考题适用类型名称</th>
              <th className="p-3 border-b border-r min-w-[300px]">题目</th>
              <th className="p-3 border-b border-r min-w-[100px] whitespace-nowrap">题目文件地址</th>
              <th className="p-3 border-b border-r min-w-[150px]">考题选项A</th>
              <th className="p-3 border-b border-r min-w-[150px]">考题选项B</th>
              <th className="p-3 border-b border-r min-w-[150px]">考题选项C</th>
              <th className="p-3 border-b border-r min-w-[150px]">考题选项D</th>
              <th className="p-3 border-b border-r min-w-[150px]">考题选项E</th>
              <th className="p-3 border-b border-r min-w-[150px]">考题选项F</th>
              <th className="p-3 border-b min-w-[80px] whitespace-nowrap">标准答案</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors">
                <td className="p-3 border-r text-gray-600">{row.questionType}</td>
                <td className="p-3 border-r text-gray-600">{row.applicableType || "生产保障"}</td>
                <td className="p-3 border-r text-gray-900 font-medium">{row.questionTitle}</td>
                <td className="p-3 border-r text-gray-500 text-xs break-all">{row.fileUrl}</td>
                <td className="p-3 border-r text-gray-600">{row.optionA}</td>
                <td className="p-3 border-r text-gray-600">{row.optionB}</td>
                <td className="p-3 border-r text-gray-600">{row.optionC}</td>
                <td className="p-3 border-r text-gray-600">{row.optionD}</td>
                <td className="p-3 border-r text-gray-600">{row.optionE}</td>
                <td className="p-3 border-r text-gray-600">{row.optionF}</td>
                <td className="p-3 text-brand-600 font-bold text-center">{row.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
